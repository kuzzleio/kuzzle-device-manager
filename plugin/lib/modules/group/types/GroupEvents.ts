import { GroupModelContent } from "../../model/types/ModelContent";

export type AskGroupRefreshModel = {
  name: "ask:device-manager:group:refresh-model";

  payload: {
    groupModel: GroupModelContent;
  };

  result: void;
};
