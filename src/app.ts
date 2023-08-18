import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {AdvancedDynamicTexture, Button, Control} from "@babylonjs/gui"
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Color4, FreeCamera } from "@babylonjs/core";




//enum the states of the game
enum State {
    START = 0,
    GAME = 1,
    LOSE = 2,
    CUTSCENE = 3
}


class App {

    //General Entire Application class properties
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;

    //Scene - related State
    private _state: number = 0
    private _cutScene: Scene;
    private _gamescene: Scene;

    constructor() {
        //create the canvas html element and attach it to the webpage
        
        this._canvas = this._createCanvas()

        //initialize babylon scene and engine
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        //camera initialization
        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI /2, 2, Vector3.Zero(), this._scene);
        camera.attachControl(this._canvas, true);
        
        //light inizialization
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1,1,0), this._scene);

        //Sphere mesh creation
        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", {diameter: 1}, this._scene);

        //hide/show the Inspector of the page
        window.addEventListener("keydown", (ev) => {
            //Shift + Ctrl + Alt + I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i') {
                //use debugLayer property to display or hide it
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        // //run the main render loop -> moved to _main()
        // this._engine.runRenderLoop(()=> {
        //     this._scene.render();
        // });

        this._main();

       
    

    }

     //PRIVATE FUNCTIONS

     //createCanvas
     private _createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        return canvas
    }

    private async _goToStart(): Promise<void> {
        // --- SCENE SET UP ---

        //allow the engine to display a loading
        this._engine.displayLoadingUI(); 

        //this will remove any control, so the scene will be immuvable
        this._scene.detachControl();

        //create a new scene
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0,0,0,1);
        
        //create a new camera
        let camera = new FreeCamera("camera1", new Vector3(0,0,0), scene);
        camera.setTarget(Vector3.Zero());

        //await till the new scene is ready
        await scene.whenReadyAsync();

        //hide the previous loading UI
        this._engine.hideLoadingUI();

        //dispose the scene setting the current state to the start
        this._scene.dispose();
        this._scene = scene; //this will associate the App scene to the new created
        this._state = State.START;

        // --- GUI SETUP ---

        //create a fullscreen ui for the GUI elements
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720; //fit our fullscreen ui to this height;

        //start button creation
        const startBtn = Button.CreateSimpleButton("start", "PLAY");
        startBtn.width = 0.2;
        startBtn.height = "40px";
        startBtn.color = "white";
        startBtn.top = "-14px";
        startBtn.thickness = 0;
        startBtn.verticalAlignment= Control.VERTICAL_ALIGNMENT_BOTTOM;
        
        //attach the button to the GUI
        guiMenu.addControl(startBtn);

        //handle interaction of the button attached 
        startBtn.onPointerDownObservable.add(()=> {
            this._goToCutScene();
            scene.detachControl(); //we disable the controls of the scene
        })

    }

    private async _goToLose(): Promise<void> {
        // --- SCENE SETUP ---

        //Loading UI
        this._engine.displayLoadingUI();
        this._scene.detachControl();

        //scene creation
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0,0,0,1);
        
        //camera creation
        let camera = new FreeCamera("camera1", new Vector3(0,0,0), scene);
        camera.setTarget(Vector3.Zero());

        // --- GUI SETUP

        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
        mainBtn.width= 0.1;
        mainBtn.height= "40px";
        mainBtn.color = "white";
        
        //attach the button to the gui
        guiMenu.addControl(mainBtn);

        //add listener to button
        mainBtn.onPointerDownObservable.add(()=> {
            this._goToStart()
        })

        // --- SCENE IS LOADED
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();

        //dispose
        this._scene.dispose();
        this._scene = scene;
        this._state = State.LOSE;

    }

    private async _goToCutScene() : Promise<void> {
        this._engine.displayLoadingUI();

        this._scene.detachControl();
        this._cutScene = new Scene(this._engine);

        let camera = new FreeCamera("camera1", new Vector3(0,0,0), this._cutScene);
        camera.setTarget(Vector3.Zero());
        this._cutScene.clearColor = new Color4(0,0,0,1);

        //GUI
        const cutScene = AdvancedDynamicTexture.CreateFullscreenUI("cutscene");

        //--PROGRESS DIALOGUE--
        const next = Button.CreateSimpleButton("next", "NEXT");
        next.color = "white";
        next.thickness = 0;
        next.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        next.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        next.width = "64px";
        next.height = "64px";
        next.top = "-3%";
        next.left = "-12%";
        cutScene.addControl(next);

        next.onPointerUpObservable.add(() => {
            this._goToGame();
        });

        //Scene is loaded
        //--WHEN SCENE IS FINISHED LOADING--
        await this._cutScene.whenReadyAsync();
        this._engine.hideLoadingUI();
        this._scene.dispose();
        this._state = State.CUTSCENE;
        this._scene = this._cutScene;

        //--START LOADING AND SETTING UP THE GAME DURING THIS SCENE--
        var finishedLoading = false;
        await this._setUpGame().then(res =>{
            finishedLoading = true;
        });
        
    }

    private async _setUpGame() {
        let scene = new Scene(this._engine);
        this._gamescene = scene;

        //...load assets of the game
    }


    private async _goToGame(){
        //--SETUP SCENE--
        this._scene.detachControl();
        let scene = this._gamescene;
        scene.clearColor = new Color4(0.01568627450980392, 0.01568627450980392, 0.20392156862745098); // a color that fit the overall color scheme better
        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        camera.setTarget(Vector3.Zero());
    
        //--GUI--
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        //dont detect any inputs from this ui while the game is loading
        scene.detachControl();
    
        //create a simple button
        const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
        loseBtn.width = 0.2
        loseBtn.height = "40px";
        loseBtn.color = "white";
        loseBtn.top = "-14px";
        loseBtn.thickness = 0;
        loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        playerUI.addControl(loseBtn);
    
        //this handles interactions with the start button attached to the scene
        loseBtn.onPointerDownObservable.add(() => {
            this._goToLose();
            scene.detachControl(); //observables disabled
        });
    
        //temporary scene objects
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
    
        //get rid of start scene, switch to gamescene and change states
        this._scene.dispose();
        this._state = State.GAME;
        this._scene = scene;
        this._engine.hideLoadingUI();
        //the game is ready, attach control back
        this._scene.attachControl();
    }

    private async _main(): Promise<void> {
        await this._goToStart();

        //register the render loop
        this._engine.runRenderLoop(()=> {
            //in here, we set which scene to render
            switch (this._state) {
                case State.START:
                    this._scene.render()
                    break;
                case State.CUTSCENE:
                    this._scene.render();
                    break;
                case State.GAME:
                    this._scene.render();
                    break;
                case State.LOSE:
                    this._scene.render();
                    break;
                default:
                    break;
            }


            //if the screen will be resized or rotated, we want to handle the resize 
            window.addEventListener('resize', ()=> {
                this._engine.resize();
            })
        })

    }



}

new App()