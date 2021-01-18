/*
 * Kuzzle, a backend software, self-hostable and ready to use
 * to power modern apps
 *
 * Copyright 2015-2021 Kuzzle
 * mailto: support AT kuzzle.io
 * website: http://kuzzle.io
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from 'path';
import readdirp from 'readdirp';
import fs from 'fs';
import { Request, Controller, InternalError, PluginContext } from 'kuzzle';

export class FrontController extends Controller {
  private context: PluginContext; 
  private frontPrefixPath: string;
  
  constructor(context, frontPrefixPath: string) {
    super(context['kuzzle']);

    this.context = context;
    this.frontPrefixPath = frontPrefixPath;
  }

  async init(context) {
    this.context = context;
    const frontCacheUrls = await this._buildFrontendCache(
      'frontend/dist/',
      this.frontPrefixPath
    );

    this.definition = {
      actions: {
        files: {
          handler: this.files.bind(this),
          http: frontCacheUrls.map(url => ({
            verb: 'get', path: url
          }))
        }
      }
    };
  }

  async files(request: Request) {
    const requestPath = request.context.connection.misc.path;
    const cachePath = requestPath.replace(`/_/${this.frontPrefixPath}`, '');

    try {
      const content = await this._getFromFrontendCache(cachePath);

      request.setResult(content, {
        headers: {
          'Content-type': 'text/html',
          charset: 'UTF-8'
        },
        raw: true
      });

      return content;
    } catch (error) {
      request.setError(new InternalError(`Something went wrong while loading frontend file ${cachePath} from cache (${error})`));
    }
  }

  private async _getFromFrontendCache(frontPath: string) {
    const content = await this.context.accessors.sdk.ms.get(frontPath);
    const decoded = Buffer.from(content.toString(),
      this._getEncodingForFile(frontPath)
    );
    return decoded;
  }

  private _getEncodingForFile(filePath): BufferEncoding {
    const textExtensions = ['.js', '.jsx', '.html', '.css', '.json', '.md'];

    if (textExtensions.indexOf(path.extname(filePath)) >= 0) {
      return 'utf8';
    }

    return 'base64';
  }

  private async _buildFrontendCache(frontPath: string, prefixPath = '') {
    const cachePaths = [];

    for await (const entry of readdirp(frontPath, { type: 'files', })) {
      const filePath = entry.path;
      const content: Buffer = await new Promise((resolve, reject) => {
        fs.readFile(path.join(frontPath, filePath), (err, data) => {
          if (err) {
            reject(err)
          }
          resolve(data)
        })
      });

      cachePaths.push(`${prefixPath}${filePath}`);

      try {
        await this.context.accessors.sdk.ms.set(filePath, content.toString(
          this._getEncodingForFile(filePath))
        );
      } catch (error) {
        console.error(`Something went wrong while caching frontend file ${filePath} (${error})`);
      }
    }

    return cachePaths;
  }
}
