import React, {useState, useEffect} from 'react';
import {StyleSheet, Button, View, Text, Dimensions} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
  CameraDeviceFormat,
} from 'react-native-vision-camera';
import {scanFaces} from 'vision-camera-face-detector';
import {lessThan, runOnJS} from 'react-native-reanimated';

// if (global.__reanimatedWorkletInit == null) require('react-native-reanimated');
const scaleWidth = 414 / 1080;
const scaleHeight = 736 / 1920;
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
export default function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [active, setActive] = useState(true);

  const [faces, setFaces] = useState();
  const [bound, setBound] = useState();
  const [direction, setDirection] = useState(
    'Put your face in the rectangular',
  );
  const [defaultBox, setDefaultBox] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });
  const devices = useCameraDevices();
  const device = devices.front;
  const checkFaceMove = face => {
    if (-12 < face.yawAngle < 12) {
      runOnJS(setDirection)('Correct!');
    }
    if (face.yawAngle < -12) {
      runOnJS(setDirection)('Look left. Please look a litle to the right');
    }
    if (face.yawAngle > 12) {
      runOnJS(setDirection)('Look right.Please  look a litle to the left');
    }
    if (face.pitchAngle > 12) {
      runOnJS(setDirection)('Look up. Please  look a litle down');
    }
    if (face.pitchAngle < -12) {
      runOnJS(setDirection)('Look down. Please  look a litle up');
    }
  };
  const checkFacePosition = face => {
    const {bounds: bound} = face;
    let faceBox = {
      width: bound.width * scaleHeight,
      height: bound.height * scaleHeight,
      x: bound.x * scaleWidth,
      y: (bound.y - bound.height / 2) * scaleHeight,
    };
    let left = faceBox.x,
      right = faceBox.x + faceBox.width,
      top = faceBox.y,
      bottom = faceBox.y + faceBox.height;
    console.log('position', faceBox.left, defaultBox.left);
    if (faceBox.width < 200) {
      runOnJS(setDirection)('Too far. Must put your face closer');
    } else if (faceBox.width > 300) {
      runOnJS(setDirection)('Too close. Must put your face further');
    } else if (left < defaultBox.left) {
      runOnJS(setDirection)('Move your head to the right');
    } else if (right > defaultBox.right) {
      console.log(right);
      runOnJS(setDirection)('Move your head to the left');
    } else if (top < defaultBox.top) {
      runOnJS(setDirection)('Move your head down');
    } else if (bottom > defaultBox.bottom) {
      runOnJS(setDirection)('Move your head up');
    }
  };

  useEffect(() => {
    runOnJS(setDirection)('');
    if (faces !== undefined && faces.length !== 0) {
      if (faces.length !== 1) {
        runOnJS(setDirection)('Too many faces recognized!');
      } else {
        runOnJS(setBound)(faces[0].bounds);

        const face = faces[0];
        checkFaceMove(face);
        checkFacePosition(face);
      }
      // setActive(false);
    } else {
      runOnJS(setDirection)('Put your face in the rectangular');
    }
  }, [faces]);

  useEffect(() => {
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
  const getBoxLayout = event => {
    let {x, y, width, height} = event.nativeEvent.layout;
    let left = x,
      right = x + width,
      top = y,
      bottom = y + height;
    runOnJS(setDefaultBox)({left, right, top, bottom});
  };
  return (
    <View style={styles.container}>
      {device != null && hasPermission ? (
        <Camera
          // style={styles.oval}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          frameProcessorFps={240}
        />
      ) : null}
      <Text style={styles.text}>{direction}</Text>
      <View
        onLayout={getBoxLayout}
        style={[styles.box, {marginTop: windowHeight / 2 - 200}]}></View>
      {bound && (
        <View
          style={[
            styles.faceBox,
            {
              width: bound.width * scaleHeight,
              height: bound.height * scaleHeight,
              marginLeft: bound.x * scaleWidth,
              marginTop: (bound.y - bound.height / 2) * scaleHeight,
            },
          ]}></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  box: {
    width: 300,
    height: 400,
    alignSelf: 'center',
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'blue',
  },
  text: {
    position: 'absolute',

    fontSize: 30,
    alignSelf: 'center',
    bottom: 100,
    color: 'white',
  },
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'red',
  },
});
