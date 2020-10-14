# webrtc-client

## Prerequisites

- [yarn](https://classic.yarnpkg.com/en/docs/install#debian-stable)

## Install

```sh
yarn
```

## Build

```sh
yarn build
```

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

## Run

```sh
yarn start
```

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

## TODO

- [ ] - Enhance InputGroup
- [x] - Implement local stream recording
- [ ] - Implement session recording using `canvas`
- [ ] - Implement handling of multiple incoming connections
- [ ] - Add logic to disable call related input field when necessary (offer sent but answer hasn't received yet)
- [ ] - Implement audio level measurement on local peer side using Web Audio
- [x] - Disable codec selection while in a call
- [ ] - Fix pre-call bitrate selection
