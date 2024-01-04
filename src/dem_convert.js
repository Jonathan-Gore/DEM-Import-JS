import { fromFile } from "geotiff";

async function readDemToXyz(filename) {
  // fromFile reads the GeoTIFF file
  const tiff = await fromFile(filename);

  // gets the first image from the GeoTIFF file.
  // GeoTIFFs can contain multiple images, but this assumes you're interested in the first one
  // which is common for DEM geotiffs.
  const image = await tiff.getImage();

  // getting image dimensions
  const width = image.getWidth();
  const height = image.getHeight();

  // this was previously used, but was receiving inconsistencies with calculated GPS points
  //const bbox = image.getBoundingBox();

  // reads the raster data (DEM elevation data) from the image
  const rasters = await image.readRasters();

  // construct the WGS-84 forward and inverse affine matrices
  const { ModelPixelScale: s, ModelTiepoint: t } = image.fileDirectory;
  let [sx, sy, ] = s;
  let [, , , gx, gy, ] = t;
  sy = -sy; // Adjust for flipped y component

  // defines an affine transformation matrix, pixelToGPS.
  // The matrix elements are as follows:
  //  1. gx and gy are the tiepoint coordinates in the geographic space (top-left pixel)
  //  2. sx and sy are the scale factors in the x and y directions, they indicate how much geographic space each pixel covers
  //
  // the zeros in the array signify that there's no shearing, and the image axes are parallel to the geographic coordinate axes
  // this is good because we want to avoid too much data interpolation
  const pixelToGPS = [gx, sx, 0, gy, 0, sy];

  // this is artifact directly from library demo:
  // https://geotiffjs.github.io/geotiff.js/
  // uncertain if useful, but does work
  //const gpsToPixel = [-gx / sx, 1 / sx, 0, -gy / sy, 0, 1 / sy];

  // 
  // top of page 4 describes the operation: https://people.computing.clemson.edu/~dhouse/courses/401/notes/affines-matrices.pdf
  const transform = (a, b, M) => [
    M[0] + M[1] * a + M[2] * b,
    M[3] + M[4] * a + M[5] * b,
  ];

  let xyzData = [];

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      // Transforming pixel coordinates to GPS coordinates using the affine transformation matrix
      const [longitude, latitude] = transform(j, i, pixelToGPS);

      // raster data is stored as one dimensional array
      // this translates the 2D pixel coordinates into a 1D array index
      const elevation = rasters[0][i * width + j];
      
      // for troubleshooting during development
      // increases compute time immensely
      //console.log(`Coordinates: (${latitude.toFixed(6)}, ${longitude.toFixed(6)}), Elevation: ${elevation}`);

      xyzData.push([longitude, latitude, elevation]);
    }
  }

  return xyzData;
}

// Usage
const filename = 'example.tif';
readDemToXyz(filename).then(xyzData => {
  console.log(xyzData);  // Prints the list of [longitude, latitude, elevation] values
});
