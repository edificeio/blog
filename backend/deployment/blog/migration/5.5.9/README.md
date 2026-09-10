# Titres de posts/blogs trop longs

Corrige les titres > 60 caractères de `db.posts`/`db.blogs` 
Le titre original conservé dans `oldTitle`.

```
# 1. état des lieux (lecture seule)
mongo <dbname> checkLongTitles.js                        
# 2. applique en dry-run
mongo <dbname> truncateLongTitles.js
# 3. applique définitivement
mongo <dbname> --eval "var DRY_RUN = false;" truncateLongTitles.js
```
