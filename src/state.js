import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from "recoil";

const transLog = atom({
  key: "transLog",
  default: [],
});

export { transLog };
