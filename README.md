## Serverless REST Assignment - Distributed Systems.

__Name:__ Dean Sinnott

__Demo:__ ... link to your YouTube video demonstration ......

### Context.

The context of my API is a craft beer collection. 

The primary table contains craft beers with the following attributes 
- id (number)
- name (string) (Sort Key)
- release_date (string) 
- description (string)
- abv (number)
- brewery (string) (Partition Key)
- style (string)
- rating (number)

### App API endpoints.

+ GET /beers - get all the beer items in the DynamoDB beers table
+ POST /beers - add a new craft beer 
+ GET /beers/{brewery}?name"" - returns a list of craft beers made by a brewery. Option to add name of craft beer for a refined search.
+ PUT /beers - update an existing craft beer item. Brewery and name cannot be altered since they are keys.
+ GET /beers/{brewery}/{name}/translate?language="" - translate the name and decription of a craft beer using AWS Translate.

### Update constraint (if relevant).

Only the user who created an item can update it. The createdBy attribute, stored on item creation, is checked against the current user's userId.
(sub of the JWTtoken)
https://mojoauth.com/glossary/jwt-subject/#:~:text=In%20the%20JSON%20Web%20Token,an%20organization%2C%20or%20a%20service.

### Translation persistence (if relevant).

Currently the translation feature allows an items name and description to be translated on request but does not include persistence. My plan would be to store translated items in a new translation table and each time a translation is requested, the sytem would check for an existing translation in the table first. (craft beer id and translated language would be the keys)

###  Extra (If relevant).

[ State whether you have created a multi-stack solution for this assignment or used lambda layers to speed up update deployments. Also, mention any aspect of the CDK framework __that was not covered in the lectures that you used in this assignment. ]
