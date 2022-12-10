# RecipEasy
Full-stack web application for searching recipes. User can also add recipes. The informations are validated on the server side and also stored in a NoSQL database. User panel requires log in and allows user to view/edit/delete the recipes and view all the receipts. 
- Developed the font-end with HTML5, CSS3, jQuery and server-side programming with Javascript which was rendered to the client-side using EJS.
- Utilized Node.js and Express.js framework build the back-end with NoSQL database MongoDb and Edamam API.
- Integrated with Edamam's API which is a 3rd party recipe search API to find recipes with ingredients and multiple categories provided by the user.
- Express-validator will be used for user input validation on the server-side.

<p >
  <img src="https://user-images.githubusercontent.com/55814513/200006694-264549e0-c895-4d8e-aa3c-29b837f1392f.png" width="55%" />
  <img src="https://user-images.githubusercontent.com/55814513/201682835-efa503a7-8da7-4f8f-8d15-ace4612711a0.png" width="44%" /> 
</p>


## How To Run
### Prerequisites
- Requires [NodeJS](https://nodejs.org/en/download/) and [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) 
- Requires [MongoDB](https://www.mongodb.com/try/download/community) and [MongoDB Compass](https://www.mongodb.com/products/compass) 
- Download the repository as zip and extract or clone it to your local device.
### Steps for Cloning the source code
-	Create a folder and open a terminal.
- Run the following command in terminal one by one.
```sh
$ git clone https://github.com/SyedAhmedCU/reciepeasy.git .
```
### Install packages and dependencies of node modules
- Once you have all the RecipEasy source codes in a folder, run the following command from terminal. 
```sh
$ npm install
```
### Set up Mongodb Compass
-	Open Mongodb Compass and start a new connection.
-	Use the following URI to start the connection.
```sh
mongodb://localhost:27017
```
-	If RecipEasy server is running, there will be a Database collection named RecipEasy in mongodb. 

### Start server
```sh
$ node index.js
```
If the nodemon package is installed, use following command.
```sh
$ npm run dev
``` 
### Open in Browser
Go to http://localhost:8080/ from the browser when the server is up and running

## License
<img src="https://user-images.githubusercontent.com/55814513/194733521-d6a38928-fe59-45d1-9e1b-cba4dab067b8.png" width=20% height=20% alt="chefdevs logo">

- Copyright 2022 ChefDevs
- Licensed under the GPLv3: http://www.gnu.org/licenses/gpl-3.0.html
### Why GPLv3?
GPL license refers to the GNU’s General Public License version 3 which is widely used to prevent software from becoming proprietary. A particular user can freely use, modify, or redistribute software without any restrictions which is what I want for this project. 
