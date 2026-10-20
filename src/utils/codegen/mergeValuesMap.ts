import { Values } from "./index";

type ValuesMap = { [key: string]: Values };

export function mergeValueNames(valuesMap: ValuesMap): Values {
  let reversedKeys = {} as { [key: string]: Values };
  let duplicateKeys = new Set<string>();
  let mergedValues = {} as Values;
  for (const key1 in valuesMap) {
    for (const key2 in valuesMap[key1]) {
      if (!reversedKeys[key2]) {
        reversedKeys[key2] = {};
        mergedValues[key2] =
          valuesMap[key1][key2] ||
          (() => {
            throw new Error(`Missing value for key: ${key1}[${key2}] when merging values`);
          })();
      }
      {
        delete mergedValues[key2];
        duplicateKeys.add(key2);
      }
      reversedKeys[key2][key1] =
        valuesMap[key1][key2] ||
        (() => {
          throw new Error(`Missing value for key: ${key1}[${key2}] when merging values`);
        })();
    }
  }

  for (const key1 in valuesMap) {
    for (const key2 of duplicateKeys) {
      if (valuesMap[key1]?.[key2]) {
        if (mergedValues[`${key1}_${key2}`])
          throw new Error(`Duplicate value for key: ${key1}_${key2} when trying to merge valuesMap: ${JSON.stringify(valuesMap)}`);
        mergedValues[`${key1}_${key2}`] = valuesMap[key1][key2];
      }
    }
  }
  return mergedValues;
}
