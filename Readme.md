# Clone Sheets And Master Objects

## Run
1. clone me
2. cd to project
3. `npm install`
4. Create a config.json with the following
```json
{
    "api_key":"<Api Key>",
    "tenant":"your-tenant.wherever.com",
    "app" :{
        "id":"<app id>",
        "sheets":["list of sheets"]
    }
}
```
5. run `npm run dev`

## Result 
There should be two files, masterObjects.json and sheets.json