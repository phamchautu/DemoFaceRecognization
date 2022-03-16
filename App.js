import * as React from 'react';
import {StyleSheet, Button, View} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {scanFaces} from 'vision-camera-face-detector';
import {runOnJS} from 'react-native-reanimated';

// if (global.__reanimatedWorkletInit == null) require('react-native-reanimated');

export default function App() {
  const [hasPermission, setHasPermission] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const [faces, setFaces] = React.useState();

  const devices = useCameraDevices();
  const device = devices.front;

  React.useEffect(() => {
    if (faces !== undefined) {
      console.log(JSON.stringify(faces));
    }
  }, [faces]);

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const scannedFaces = scanFaces(frame);
    runOnJS(setFaces)(scannedFaces);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignContent: 'center',
      }}>
      {/* <Button title="Press" onPress={() => setActive(true)} /> */}
      {device != null && hasPermission ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          frameProcessorFps={300}
        />
      ) : null}
    </View>
  );
}
