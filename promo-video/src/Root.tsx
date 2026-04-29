import { Composition } from "remotion";
import { EcoPestPromo } from "./EcoPestPromo";

export const RemotionRoot = () => {
  return (
    <Composition
      component={EcoPestPromo}
      durationInFrames={1350}
      fps={30}
      height={1080}
      id="EcoPestPromo"
      width={1920}
    />
  );
};
