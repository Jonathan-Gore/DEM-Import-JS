import { fromFile } from 'geotiff';

//Script assumes EPSG:4326

async function readDemToXyz(filename) {
  const tiff = await fromFile(filename);
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const bbox = image.getBoundingBox();
  const elevationData = await image.readRasters({ interleave: true });

  const deltaX = (bbox[2] - bbox[0]) / width;
  const deltaY = (bbox[3] - bbox[1]) / height;

  let xyzData = [];

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const x = bbox[0] + j * deltaX;
      const y = bbox[1] + i * deltaY;
      const z = elevationData[i * width + j];
      console.log(`Coordinates: (${x.toFixed(9)}, ${y.toFixed(9)}), Elevation: ${z}`);

      xyzData.push([x, y, z]);
    }
  }

  return xyzData;
}

// Usage
const filename = 'example.tif';
readDemToXyz(filename).then(xyzData => {
  //console.log(xyzData.slice(0, 100));  // Print the first 100 [x, y, MSL] values
  //console.log("Printing all values")
  //console.log(xyzData)
});
