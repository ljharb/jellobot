const url = require('url');
const superagent = require('superagent');
const cheerio = require('cheerio');
const { messageToFactoid } = require('../factoids/factoidsPlugin');

function slugify(words) {
  return words
    .map((x) => x.trim())
    .join('-')
    .replace(/[^a-zA-Z0-9_.]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fixLanguage(origRes, lastRedirect) {
  let res = origRes;

  // attempt to rewrite the language part of the URL
  const urlParts = url.parse(lastRedirect);
  urlParts.pathname = urlParts.pathname.replace(
    /^\/(\w+)(\/docs\/)/,
    (m, lang, rest) => `/en-US${rest}`,
  );

  // If we changed the URL, we need to do another request for it
  const fixedUrl = url.format(urlParts);

  if (fixedUrl !== lastRedirect) {
    console.error(`Translated MDN URL from "${lastRedirect}" to "${fixedUrl}"`);
    res = await superagent.get(fixedUrl).redirects(1);
  }

  return res;
}

async function fixRedirect(res) {
  const $ = cheerio.load(res.text);
  const meta = $('meta[http-equiv="refresh"]').attr('content') || '';
  const reg = /url=\/l\/\?uddg=([^&]*)/;
  const match = meta.match(reg);
  if (!match) {
    return res;
  }

  const redirect = decodeURIComponent(match[1]);
  const redirectURL = new URL(redirect);

  if (
    redirectURL.host === 'developer.mozilla.org' &&
    (redirectURL.protocol === 'https:' || redirectURL.protocol === 'http:')
  ) {
    const redirectRes = await superagent
      .get(redirect)
      .set('accept-language', 'en-US,en;q=0.5')
      .redirects(5);
    return redirectRes;
  }
  return res;
}

module.exports = async function mdnPlugin(msg) {
  if (!msg.command) return;

  const words = msg.command.command.split(' ');
  if (words[0] !== 'mdn') {
    return;
  }
  const factoid = await messageToFactoid(msg);
  if (factoid) {
    return;
  }
  msg.handling();

  const initialUrl = `https://mdn.io/${slugify(words.slice(1))}`;

  let lastRedirect = initialUrl;
  let res = null;

  try {
    res = await superagent
      .get(initialUrl)
      .set('accept-language', 'en-US,en;q=0.5')
      .redirects(5)
      .on('redirect', (redirect) => {
        lastRedirect = redirect.headers.location;
      });
  } catch (e) {
    // Rethrow if it's not an HTTP error
    if (!e || !e.response) {
      throw e;
    }
  }

  if (res) {
    res = await fixLanguage(res, lastRedirect).catch(() => null);
  }

  if (res) {
    res = await fixRedirect(res).catch(() => null);
  }

  if (!res || !res.ok) {
    msg.respondWithMention(`Try ${initialUrl} (couldn't fetch metadata)`);
    return;
  }

  const $ = cheerio.load(res.text);

  const article = $('article');

  const isDeprecated = article.find('.notecard.deprecated').text().trim();

  const firstP = article
    .find('p') // if cheerio was less bad, we could do .first(':not(.notecard) > p')
    .toArray()
    .find((el) => !/notecard/.test(el.parent.attribs.class));

  const description = $(firstP)
    .text()
    .trim()
    .replace(/^The /, '')
    .replace(/\s{2,}/g, ' ');

  msg.respondWithMention(
    `${isDeprecated ? 'DEPRECATED ' : ''}${description.slice(0, 350)}${
      description.length > 350 ? '…' : ''
    } ${initialUrl}`,
  );
};
