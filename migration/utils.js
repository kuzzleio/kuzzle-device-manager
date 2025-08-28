import { createWriteStream, createReadStream, rename, existsSync } from 'fs';
import { createInterface } from 'readline';
import path from 'path';

const fileName = 'documents.jsonl'; // Fichier d'entrée
const tempFileName = 'temp-' + fileName;

export function transformDocuments(
  collection,
  indexPath,
  callBack,
  alternativeOutPutPath,
  endCallBack,
) {
  let error;
  const inputFilePath = path.join(indexPath, collection, fileName);

  const tempFilePath = path.join(indexPath, collection, tempFileName);
  if (!existsSync(inputFilePath)) {
    console.log("THE FILE DOESN'T EXIST at " + inputFilePath);
    return;
  }
  const readStream = createReadStream(inputFilePath);
  const writeStream = createWriteStream(tempFilePath);

  const rl = createInterface({
    input: readStream,
  });

  rl.on('line', (line) => {
    try {
      const doc = callBack(line);
      writeStream.write(JSON.stringify(doc) + '\n');
    } catch (err) {
      console.log('Error in ' + collection);
      console.log(err)
      error = true;
    }
  });

  rl.on('close', () => {
    if (error) {
      return;
    }
    if (endCallBack) {
      endCallBack();
    }
    writeStream.end(() => {
      // Remplace l'ancien fichier par le nouveau

      rename(tempFilePath, alternativeOutPutPath || inputFilePath, (err) => {
        if (err) {
          console.error('Erreur lors du remplacement du fichier : ' + collection, err);
        } else {
          console.log('Fichier mis à jour avec succès');
        }
      });
    });
  });
}

export function clearProperties(obj, properties) {
  return Object.keys(obj)
    .filter((key) => !properties.includes(key))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}
