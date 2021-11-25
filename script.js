const fs = require("fs");
const util = require("util");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const outputPath = "./output.txt";
const artistsPath = "./artists.json";

const checkErrors = {
  add: ({ id, name }) => {
    if (!id)
      throw new Error(
        'First argument (artist id) of the "add" action is not provided'
      );
    if (!name)
      throw new Error(
        'Second argument (artist name) of the "add" action is not provided'
      );
  },
};

const readArtists = async () => {
  try {
    const data = await readFile("./artists.json", "utf-8");

    return JSON.parse(data);
  } catch (error) {
    throw error;
  }
};

const formatArgs = ({ id, name }) => {
  const trimmedId = id.replace(/[[\]']+/g, "").trim();

  return {
    id: `${trimmedId.slice(0, 1).toUpperCase()}${trimmedId
      .slice(1)
      .toLowerCase()}`,
    name: name.trim(),
  };
};

const sortAlphabetically = (data) =>
  [...data].sort(([_, a], [__, b]) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

const group = (data) => {
  const result = [];

  let group = 0;
  let groupLetter = "";

  data.forEach(([id, name]) => {
    const letter = name[0].toLowerCase();

    if (!groupLetter) {
      groupLetter = letter;
    } else if (groupLetter !== letter) {
      group += 1;
      groupLetter = letter;
    }

    result[group] = [].concat(result[group] || [], [[id, name]]);
  });

  return result;
};

const join = (data) =>
  data
    .map((group) => group.map(([id, name]) => `[${id}, ${name}]`).join(", \n"))
    .join("\n\n");

const add = async (data) => {
  try {
    checkErrors.add(data);

    const { id, name } = formatArgs(data);

    const artists = await readArtists();

    const isAlreadyAdded = !!artists.find(([artistId]) => artistId === id);

    if (!isAlreadyAdded) {
      artists.push([id, name]);

      const sorted = sortAlphabetically(artists);
      const grouped = group(sorted);
      const joined = join(grouped);

      await writeFile(outputPath, joined);
      await writeFile(artistsPath, JSON.stringify(sorted));

      console.log(
        `Successfully added: ${data.name}\nCopy content from the ${outputPath} file`
      );
    } else {
      throw new Error(`${id} (${name}) has already been added`);
    }
  } catch (error) {
    throw error;
  }
};

const remove = async (idOrName) => {
  try {
    const target = idOrName.trim().toLowerCase();

    const artists = await readArtists();

    const indexToRemove = artists.findIndex(([id, name]) =>
      [id.toLowerCase(), name.toLowerCase()].includes(target)
    );

    if (indexToRemove >= 0) {
      const newArtists = artists.filter((_, index) => index !== indexToRemove);
      const grouped = group(newArtists);
      const joined = join(grouped);

      await writeFile(outputPath, joined);
      await writeFile(artistsPath, JSON.stringify(newArtists));

      console.log(
        `Successfully removed: ${idOrName}\nCopy content from the ${outputPath} file`
      );
    } else {
      throw new Error("No match found. Won't removed");
    }
  } catch (error) {
    throw error;
  }
};

const start = () => {
  const [action, arg1, arg2] = process.argv.slice(2);

  try {
    switch (action) {
      case "add":
        return add({ id: arg1, name: arg2 });
      case "remove":
        return remove(arg1);
      default: {
        throw new Error(`The action type "${action}" is not found`);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

start();
