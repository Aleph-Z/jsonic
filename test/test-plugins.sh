# Assumes plugin repos checked out at same level

cd ../path
npm link jsonic
npm run build
npm test

cd ../directive
npm link jsonic
npm run build
npm test

cd ../multisource
npm link jsonic
npm run build
npm test

cd ../hoover
npm link jsonic
npm run build
npm test

cd ../expr
npm link jsonic
npm run build
npm test

cd ../csv
npm link jsonic
npm run build
npm test

cd ../toml
npm link jsonic
npm run build
npm test

cd ../ini
npm link jsonic
npm run build
npm test

cd ../jsonic
