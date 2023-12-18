## Migration

```
    yarn typeorm migration:generate migrations -d ./src/utils/dataSource.ts
   yarn typeorm migration:create src/migrations
```

-   compare new database with existing schema in the codebase

```
### set scripts in package.json: "typeorm": "typeorm-ts-node-commonjs"
yarn typeorm migration:generate src/migrations  -d ./src/utils/dataSource.ts
```
