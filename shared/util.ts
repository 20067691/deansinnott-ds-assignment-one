import { marshall } from "@aws-sdk/util-dynamodb";
import { CraftBeer } from "./types";

type Entity = CraftBeer;  // NEW
export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateItem(e);
  });
};