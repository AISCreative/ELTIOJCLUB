/* Firebase: catálogo público en lectura, edición solo con sesión autorizada y reglas Firestore. */
(function(){
'use strict';
const firebaseConfig = {
  apiKey: 'AIzaSyA4iohD1qPChfscyfVLBoI522ijezhNjws',
  authDomain: 'el-tio-j.firebaseapp.com',
  projectId: 'el-tio-j',
  storageBucket: 'el-tio-j.firebasestorage.app',
  messagingSenderId: '126486730068',
  appId: '1:126486730068:web:24d479173237d0c7cc24c1'
};
const ADMIN_EMAIL='club@gmail.com'; // No es contraseña; es el identificador público de la cuenta Firebase.
const app=firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
const db=firebase.firestore(app);
const auth=firebase.auth(app);
const catalogo=db.collection('catalogo').doc('principal');
const imagenes=db.collection('imagenes');
const cache=new Map();
const solicitado=new Set();
const imagenVacia='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="100%25" height="100%25" fill="%23222"/%3E%3Ctext x="50%25" y="53%25" text-anchor="middle" fill="%23888" font-size="16"%3ECARGANDO%3C/text%3E%3C/svg%3E';
function mensajeError(e){console.error('Firebase',e)}
window.CatalogoFirebase={
  escucharCatalogo(callback,onError){return catalogo.onSnapshot(s=>callback(s.exists?s.data():null),onError||mensajeError)},
  async leerCatalogo(){const s=await catalogo.get();return s.exists?s.data():null},
  guardarCatalogo(datos){return catalogo.set({...datos,actualizado:firebase.firestore.FieldValue.serverTimestamp()})},
  entrar(clave){return auth.signInWithEmailAndPassword(ADMIN_EMAIL,clave)},
  salir(){return auth.signOut()},
  observarAutenticacion(callback){return auth.onAuthStateChanged(callback,mensajeError)},
  async guardarImagen(data){
    if(!/^data:image\/(jpeg|png|webp);base64,/.test(data))throw new Error('Imagen inválida');
    // Cada imagen se guarda separadamente para no superar el límite de 1 MiB del documento del catálogo.
    if(data.length>750000)throw new Error('Imagen demasiado grande, usa una más pequeña');
    const doc=imagenes.doc();await doc.set({data,creado:firebase.firestore.FieldValue.serverTimestamp()});
    cache.set(doc.id,data);return 'dbimg:'+doc.id;
  },
  resolverImagen(ruta,onReady){
    if(!ruta || typeof ruta!=='string')return imagenVacia;
    if(!ruta.startsWith('dbimg:'))return ruta;
    const id=ruta.substring(6);
    if(!/^[a-zA-Z0-9]{10,30}$/.test(id))return imagenVacia;
    if(cache.has(id))return cache.get(id);
    if(!solicitado.has(id)){
      solicitado.add(id);
      imagenes.doc(id).get().then(s=>{
        if(s.exists && s.data().data){cache.set(id,s.data().data);if(onReady)onReady()}
      }).catch(mensajeError).finally(()=>solicitado.delete(id));
    }
    return imagenVacia;
  }
};
})();
