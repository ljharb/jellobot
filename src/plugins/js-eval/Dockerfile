# This should be kept somewhat recent for local development, but the js-eval/init script
# sets this to the latest version from nodejs.org/download/release
ARG node_version=v23.6.0

FROM debian:10-slim
ARG node_version

RUN apt-get update && apt-get install -y xz-utils ca-certificates curl unzip --no-install-recommends
RUN node_version=${node_version} \
  && curl -fsSLO --compressed "https://nodejs.org/download/release/$node_version/node-$node_version-linux-x64.tar.xz" \
  && tar -xJf "node-$node_version-linux-x64.tar.xz" -C /usr/local --strip-components=1 --no-same-owner
RUN node --version

# install deno
ENV DENO_INSTALL=/usr/local
RUN curl -fsSL https://deno.land/x/install/install.sh -o install-deno.sh \
  && sh install-deno.sh \
  # && chown node:node /usr/local/bin/deno \
  && rm install-deno.sh
RUN deno --version

# install shims, and acorn+nearley needed by engine262
RUN npm i --prefix /run airbnb-js-shims@latest string.prototype.at@latest array.prototype.at@latest @bloomberg/record-tuple-polyfill@latest nearley@latest object.groupby@latest map.groupby@latest array.prototype.flat@latest array.prototype.flatmap@latest array.prototype.with@latest array.prototype.tosorted@latest array.prototype.toreversed@latest array.prototype.tospliced@latest set.prototype.union set.prototype.intersection set.prototype.difference set.prototype.symmetricdifference set.prototype.issubsetof set.prototype.issupersetof set.prototype.isdisjointfrom es-set es-map suppressed-error es-iterator-helpers arraybuffer.prototype.detached disposablestack promise.try math.sumprecise regexp.escape promise.prototype.finally
RUN curl https://engine262.js.org/engine262/engine262.js -o /run/node_modules/engine262.js

RUN useradd node && mkdir -p /home/node && chown -R node:node /home/node && chown node:node /usr/local/bin/deno
WORKDIR /home/node

COPY --chown=node run.js /run/
USER node
ENV NODE_ICU_DATA=/run/node_modules/full-icu
CMD ["node", "--no-warnings", "/run/run.js"]
