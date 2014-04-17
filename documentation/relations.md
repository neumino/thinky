---
layout: documentation
permalink: relations/
---

## Relations

### Introduction

### save

### getJoin

### delete

### Internals

__Interals__:
The third table is named `<Model1.getTableName()>_<Model2.getTableName()>` 
where the names are alphabetically order.  

If you do not, while `thinky` will be able to create/save links, it will not be able to
automatically delete links when documents are deleted.
The only way now to delete a link in this case is to manually do it.

