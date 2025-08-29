const fs = require("fs");
const path = require("path");

const SONGS_DIR = path.join(__dirname, "..", "songs");

const OUTPUT_FILE = path.join(__dirname, "..", "songs.json");

function getAlbumData(albumPath, albumName) {
  const files = fs.readdirSync(albumPath);
  const songs = files.filter(f => f.endsWith(".mp3"));
  let info = { title: albumName, Description: "" };

  // If info.json exists inside album, merge it
  const infoPath = path.join(albumPath, "info.json");
  if (fs.existsSync(infoPath)) {
    try {
      info = { ...info, ...JSON.parse(fs.readFileSync(infoPath, "utf8")) };
    } catch (err) {
      console.warn(`⚠️ Could not parse info.json in ${albumName}:`, err);
    }
  }

  return {
    folder: albumName,
    info,
    songs,
  };
}

function generateSongsJSON() {
  const albums = {};
  const albumFolders = fs.readdirSync(SONGS_DIR);

  for (const folder of albumFolders) {
    const albumPath = path.join(SONGS_DIR, folder);
    if (fs.statSync(albumPath).isDirectory()) {
      albums[folder] = getAlbumData(albumPath, folder);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(albums, null, 2), "utf8");
  console.log(`✅ songs.json generated with ${Object.keys(albums).length} albums`);
}

generateSongsJSON();
