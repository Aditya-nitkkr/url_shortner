import { readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import path from "path";
import crypto from "crypto";

const PORT = 6000;
const DATA_FILE = path.join("data", "links.json");

const serveFile = async (res, filePath, contentType) => {
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end(" Error in fetching the file");
  }
};
const loadLinks = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(DATA_FILE, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};

const saveLinks = async (links) => {
  await writeFile(DATA_FILE, JSON.stringify(links));
};

const server = createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      return serveFile(res, path.join("public", "index.html"), "text/html");
    } else if (req.url === "/style.css") {
      return serveFile(res, path.join("public", "style.css"), "text/css");
    } else if (req.url === "/links") {
      const links = await loadLinks();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(links));
    } else {
      const links = await loadLinks();
      const shortcode = req.url.slice(1);
      console.log(shortcode);
      if (links[shortcode]) {
        res.writeHead(302, { location: links[shortcode] });
        return res.end();
      }
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Short code is not found");
    }
  }

  if (req.method === "POST" && req.url === "/shorten") {
    //get stored data
    const links = await loadLinks();

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      //   console.log(body);
      const { url, shortCode } = JSON.parse(body);
      //   console.log(url);

      //if no url is given
      if (!url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("URL is required");
      }

      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

      //if the shortcode is already existed
      if (links[finalShortCode]) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end(
          "Short code is already exist ,try to enter new short code"
        );
      }

      links[finalShortCode] = url;
      await saveLinks(links);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end();
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running at port number : ${PORT}`);
});
