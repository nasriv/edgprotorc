let args = {
    algo : null, 
    pointer : null,
    values : []
};

let definition = null;

// get slider values
let s = document.getElementById('size').value;
let nx = document.getElementById('Nx').value;
let ny = document.getElementById('Ny').value;

let param1 = new RhinoCompute.Grasshopper.DataTree('RH_IN:Size');
param1.append([0], [s]);

let param2 = new RhinoCompute.Grasshopper.DataTree('RH_IN:XCount');
param2.append([0], [nx]);

let param3 = new RhinoCompute.Grasshopper.DataTree('RH_IN:YCount');
param3.append([0], [ny]);

rhino3dm().then(async m => {
    console.log('Loaded rhino3dm.');
    rhino = m; // global

    //RhinoCompute.url = "http://localhost:8081/";
    RhinoCompute.url = "https://40.88.39.64/";
    RhinoCompute.apiKey = "theRhinoKey465@"; // your Rhino.Compute server api key, use empty for localhost

    // load a grasshopper file!
    let url = 'BeeHive_Test.gh';
    let res = await fetch(url);
    let buffer = await res.arrayBuffer();
    let arr = new Uint8Array(buffer);
    definition = arr;

    init();
    compute();
});

function compute(){

    // clear values
    let trees = [];

    trees.push(param1);
    trees.push(param2);
    trees.push(param3);
    console.log(param1, param2, param3);

    RhinoCompute.Grasshopper.evaluateDefinition(definition, trees).then(result => {
        // RhinoCompute.computeFetch("grasshopper", args).then(result => {
        console.log(result);

        // hide spinner
        document.getElementById('loader').style.display = 'none';
        let meshes = [];
        let jsdata = result.values[0].InnerTree['{ 0; }'];
        for (var i=0;i<jsdata.length;i++){
            let data = JSON.parse(jsdata[i].data);
            let mesh = rhino.CommonObject.decode(data);
    
            let material = new THREE.MeshNormalMaterial();
            let threeMesh = meshToThreejs(mesh, material);
            meshes.push(threeMesh);
        }
        // clear meshes from scene
        for( var i = scene.children.length - 1; i >= 0; i--) { 
            obj = scene.children[i];
            scene.remove(obj); 
       }
        /*scene.traverse(child => {
            if(child.type === 'Mesh'){
                scene.remove(child);
            }
        });*/
        meshes.forEach(m=>{scene.add(m);});
        //scene.add(threeMesh);
    });
}

function onSliderChange(){

    // show spinner
    document.getElementById('loader').style.display = 'block';

    // get slider values
    s = document.getElementById('size').value;
    nx = document.getElementById('Nx').value;
    ny = document.getElementById('Ny').value;

    param1 = new RhinoCompute.Grasshopper.DataTree('RH_IN:Size');
    param1.append([0], [s]);

    param2 = new RhinoCompute.Grasshopper.DataTree('RH_IN:XCount');
    param2.append([0], [nx]);

    param3 = new RhinoCompute.Grasshopper.DataTree('RH_IN:YCount');
    param3.append([0], [ny]);

    compute();
}

// BOILERPLATE //

var scene, camera, renderer, controls;

function init(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(1,1,1);
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000 );

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    var canvas = document.getElementById('canvas');
    canvas.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement  );

    camera.position.z = 50;

    window.addEventListener( 'resize', onWindowResize, false );

    animate();
}

var animate = function () {
    requestAnimationFrame( animate );
    controls.update();
    renderer.render( scene, camera );
};
  
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    animate();
}

function meshToThreejs(mesh, material) {
    let loader = new THREE.BufferGeometryLoader();
    var geometry = loader.parse(mesh.toThreejsJSON());
    return new THREE.Mesh(geometry, material);
}