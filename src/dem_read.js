import { fromFile } from "geotiff";

async function printGeoTiffInfo(filename) {
    const tiff = await fromFile(filename);
    const image = await tiff.getImage();

    console.log(`Raster Dimensions: ${image.getWidth()}x${image.getHeight()}`);

    const boundingBox = image.getBoundingBox();
    console.log(`Bounding Box: ${boundingBox}`);

    console.log("Coordinate Reference System: EPSG:4326 (Lat/Lon)");

    const rasters = await image.readRasters({ window: [0, 0, 10, 10] });
    console.log(`Elevation Data (first 10x10 pixels):\n${rasters[0]}`);

    const [resolutionX, resolutionY] = image.getResolution();
    console.log(`Pixel Size (degrees): (${resolutionX}, ${resolutionY})`);
}

const filename = 'example.tif';
printGeoTiffInfo(filename).catch(error => console.error(error));