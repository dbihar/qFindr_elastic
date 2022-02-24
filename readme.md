# qFindr File Finder

Find files and applications on your computer easily.

## Commands

~~~
> find readme
> open readme
~~~

You can also find applications without a prefix by just typing in part of the
name:

~~~
> chrome
~~~

## Installing

Add `dbihar/qFindr_elastic` inside of `plugins` block of your  `~/.zazurc.json` file.

~~~ json
{
  "plugins": [
    "dbihar/qFindr_elastic"
  ]
}
~~~

## Config

If you want to overwrite the directories you can.

  * `append` if you want to keep the original, and just add additonal
    directories, set this to `true`
  * `directories.filePath` set this array for which paths you want FILES to be
    searched for via `open *` or `find *`
  * `directories.appPath` will be an array of places you wan to find your
    APPLICATIONS. For example `chrome`

~~~ json
{
  "plugins": [
    {
      "name": "tinytacoteam/zazu-file-finder",
      "variables": {
        "append": true,
        "directories": {
          "filePath": [
            "~/Documents"
          ],
          "appPath": [
            "/usr/games"
          ],
          "excludeName": [
            "node_modules"
          ],
          "excludePath": [
            "~/Library"
          ]
        }
      }
    }
  ]
}
~~~

If you want to change the matching algorithm you can:

```json
{
  "plugins": [
    {
      "name": "dbihar/qFindr_elastic",
      "variables": {
        "matchBy": "stringincludes" // "fuzzyfind" by default
      }
    }
  ]
}
```

## Development

### Testing

WARNING: If you are on MacOS, you cannot test this plugin where Zazu installs
it, since `~/.zazu` as a hidden folder is ignored.

Run tests in current system environment:

```bash
npm run test
```

Run tests in Docker, which is helpful for running tests in Linux environment when using other platform such as macOS or Windows.

```bash
npm run docker-test
```
