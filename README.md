# Volcano Plot
The aim of this project is to visualize Treatment-Emergent Adverse Events(TEAE) in a single graph. 

## Requirements

For development, you will only need Node.js and a node global package, manager

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

###

## Development

### Install

    $ git clone https://github.com/nikhil-nomula/volcano_plot.git
    $ cd volcano_plot
    $ npm install

### Building the project

    $ npm run dev

### Running the project

    $ npm run start-dev

### Accessing the volcano plot

    http://localhost:8080
    
## Deployment

### Install

    $ git clone https://github.com/nikhil-nomula/volcano_plot.git
    $ cd volcano_plot
    $ npm install

### Building the project

    $ npm run build

### Deploy file

    $ cd dist

### Accessing the plot

Double click on index.html file
    
If you are on linux operating system
    
    $ open index.html 
    
