// three.jsのセットアップ
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.getElementById("shelf").appendChild(renderer.domElement);

// カメラ位置設定
camera.position.set(0, 4, 15);
camera.lookAt(0, 1.5, 0);

// 背景色を明るく設定
renderer.setClearColor(0xf0f0f0);

// 環境光とスポットライトを追加
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 0.8);
spotLight.position.set(5, 15, 10);
spotLight.castShadow = true;
scene.add(spotLight);

// 本棚の構造を作成する関数
function createShelf() {
  const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
  const shelfWidth = 3.5;
  const shelfHeight = 0.2;
  const shelfDepth = 1;
  const shelfSpacing = 2.5;

  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth);
    const shelf = new THREE.Mesh(geometry, shelfMaterial);
    shelf.position.set(0, i * shelfSpacing - 1.3, -0.5);
    shelf.receiveShadow = true;
    scene.add(shelf);
  }
}

// 本を作成する関数
function createBook(textureUrl, x, y, link) {
  const geometry = new THREE.BoxGeometry(0.7, 1.7, 0.1);
  const texture = new THREE.TextureLoader().load(textureUrl);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const book = new THREE.Mesh(geometry, material);
  book.position.set(x, y + 0.9, -0.3);
  book.castShadow = true;
  book.userData = { link };
  scene.add(book);
  return book;
}

// 本棚に仮の本を配置
function createPlaceholderBooks() {
  const bookUrls = [
    'img/bookimg.jpg',
    'img/bookimg.jpg',
    'img/bookimg.jpg',
    'img/bookimg.jpg'
  ];

  const books = [];
  const booksPerShelf = 4;
  const shelfLevels = 3;
  const shelfSpacing = 2.5;

  for (let level = 0; level < shelfLevels; level++) {
    const yPosition = level * shelfSpacing - 1.3;
    bookUrls.forEach((url, index) => {
      const xPosition = (index - (booksPerShelf - 1) / 2) * 0.8;
      const book = createBook(url, xPosition, yPosition + 0.1, '#'); // 仮のリンク
      books.push(book);
    });
  }

  return books;
}

// 本棚と仮の本を配置
createShelf();
const books = createPlaceholderBooks();

// クリックイベント処理の追加
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(books);

  if (intersects.length > 0) {
    const clickedBook = intersects[0].object;
    if (clickedBook.userData.link) {
      window.location.href = clickedBook.userData.link;
    }
  }
}

window.addEventListener('click', onMouseClick, false);

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// リサイズ処理を関数にまとめる
function handleResize() {
  const isMobile = window.innerWidth <= 768;
  const renderHeight = isMobile ? window.innerHeight * 0.8 : window.innerHeight * 1;

  renderer.setSize(window.innerWidth, renderHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  const scaleFactor = isMobile ? 0.7 : 1;
  scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

// リサイズイベント
window.addEventListener('resize', handleResize);

// ページが再表示されたときにリサイズ処理を呼び出す
window.addEventListener('pageshow', handleResize);


// 必要なFirebaseライブラリをインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, getDocs } 
from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebaseの設定情報
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const apiKey = "";  // TMDBのAPIキーを設定

// TMDB APIから映画またはドラマの画像URLを取得する関数
async function fetchTmdbImage(id, type) {
  const response = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=ja`);
  const data = await response.json();
  return `http://localhost:8080/https://image.tmdb.org/t/p/w500${data.poster_path}`;
}

// Firestoreから最新の12個の作品画像を取得し、棚の本のテクスチャを更新する関数
async function updateBooksFromFirestore() {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const firestoreData = [];
    let count = 0;

    for (const doc of querySnapshot.docs) {
      if (count >= 12) break;
      const data = doc.data();

      if (data.myBest?.myBestMovie) {
        const movieImageUrl = await fetchTmdbImage(data.myBest.myBestMovie, "movie");
        const movieLink = `sakuhin.html?type=movie&id=${data.myBest.myBestMovie}`;
        firestoreData.unshift({ url: movieImageUrl, link: movieLink });
        count++;
      }

      if (count < 12 && data.myBest?.myBestDrama) {
        const dramaImageUrl = await fetchTmdbImage(data.myBest.myBestDrama, "tv");
        const dramaLink = `sakuhin.html?type=tv&id=${data.myBest.myBestDrama}`;
        firestoreData.unshift({ url: dramaImageUrl, link: dramaLink });
        count++;
      }
    }

    books.forEach((book, index) => {
      if (index < firestoreData.length) {
        const { url, link } = firestoreData[index];
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          url,
          (texture) => {
            book.material.map = texture;
            book.material.needsUpdate = true;
            book.userData.link = link;
          },
          undefined,
          (error) => console.error("Texture loading error:", error)
        );
      }
    });
  } catch (error) {
    console.error("Firestoreからデータを取得して本のテクスチャを更新中にエラー:", error);
  }
}

updateBooksFromFirestore();

// マウスムーブイベントのためのベクターと変数
let hoveredBook = null;
const raycaster2 = new THREE.Raycaster();
const mouse2 = new THREE.Vector2();

// 各本の初期位置を保持するマップ
const initialPositions = new Map();
books.forEach((book) => {
  initialPositions.set(book, book.position.clone()); // 初期位置を記録
});

// マウスムーブイベントを監視
function onMouseMove(event) {
  mouse2.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse2.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster2.setFromCamera(mouse2, camera);
  const intersects = raycaster2.intersectObjects(books);

  if (intersects.length > 0) {
    const intersectedBook = intersects[0].object;

    // ホバーされた本が変更された場合のみ浮き上がりアニメーションを実行
    if (hoveredBook !== intersectedBook) {
      if (hoveredBook) {
        // 前のホバーされた本を元の初期位置に戻す
        gsap.to(hoveredBook.position, {
          y: initialPositions.get(hoveredBook).y, // 初期位置に戻す
          duration: 0.3,
        });
      }

      // 新しいホバーされた本を少し浮かせる
      hoveredBook = intersectedBook;
      gsap.to(hoveredBook.position, {
        y: initialPositions.get(hoveredBook).y + 0.2, // 初期位置から浮かせる
        duration: 0.3,
      });
    }
  } else {
    // ホバーが解除されたときに元の初期位置に戻す
    if (hoveredBook) {
      gsap.to(hoveredBook.position, {
        y: initialPositions.get(hoveredBook).y, // 初期位置に戻す
        duration: 0.3,
      });
      hoveredBook = null;
    }
  }
}

window.addEventListener('mousemove', onMouseMove, false);
