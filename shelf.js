// three.jsのセットアップ
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
renderer.shadowMap.enabled = true;
document.getElementById("shelf").appendChild(renderer.domElement);

// カメラ位置設定
camera.position.set(0, 3, 15);
camera.lookAt(0, 0, 0);

// 背景色を明るく設定
renderer.setClearColor(0xf0f0f0);

// 環境光とスポットライトを追加
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1.2);
spotLight.position.set(5, 15, 10);
spotLight.castShadow = true;
scene.add(spotLight);

// 本棚の構造を作成する関数
function createShelf() {
  const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
  const shelfWidth = 3;
  const shelfHeight = 0.2;
  const shelfDepth = 1;

  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth);
    const shelf = new THREE.Mesh(geometry, shelfMaterial);
    shelf.position.set(0, -0.8 + i * 1.6, -0.5); // 各棚板の高さと奥行きを調整
    shelf.receiveShadow = true;
    scene.add(shelf);
  }
}

// 本を作成する関数
function createBook(textureUrl, x, y) {
  const geometry = new THREE.BoxGeometry(0.3, 1.2, 0.1); // 奥行きを少し薄く
  const texture = new THREE.TextureLoader().load(textureUrl);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const book = new THREE.Mesh(geometry, material);
  book.position.set(x, y + 0.6, -0.2); // 本を棚板の上に正確に配置
  book.castShadow = true;
  return book;
}

// 仮の本を本棚に配置
function createPlaceholderBooks() {
  const bookUrls = [
    'img/bookimg.jpg',
    'img/bookimg.jpg',
    'img/bookimg.jpg',
    'img/bookimg.jpg',
    'img/bookimg.jpg'
  ];

  const books = []; // 本を管理する配列
  const booksPerShelf = 5; // 各段に5冊の本を並べる
  const shelfLevels = 3; // 棚は3段

  for (let level = 0; level < shelfLevels; level++) {
    bookUrls.forEach((url, index) => {
      const xPosition = (index - (booksPerShelf - 1) / 2) * 0.6; // 本を段の中央に均等に配置
      const yPosition = -0.8 + level * 1.6; // 各段ごとに本の高さを調整
      const book = createBook(url, xPosition, yPosition);
      scene.add(book);
      books.push(book);
    });
  }

  return books;
}

// 本棚と仮の本を配置
createShelf();
const books = createPlaceholderBooks(); // 本のリストを保持

// カメラの動きを管理する変数
let angle = 0;
let rotationSpeed = 0.001; // 回転速度

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);

  // カメラを回転させる範囲を設定
  angle += rotationSpeed;
  const radius = 15; // 回転半径
  camera.position.x = radius * Math.sin(angle);
  camera.position.z = radius * Math.cos(angle);
  camera.lookAt(0, 1, 0); // 棚の中心を常に注視

  // 回転が一定の範囲を超えたら方向を逆にする
  if (angle > Math.PI / 4 || angle < -Math.PI / 4) {
    rotationSpeed = -rotationSpeed; // 回転方向を反転
  }

  renderer.render(scene, camera);
}

animate();

// リサイズイベントでレスポンシブ対応
window.addEventListener('resize', () => {
    // ウィンドウ幅がスマホサイズ（768px以下）ならレンダラーの高さを調整
    const isMobile = window.innerWidth <= 768;
    const renderHeight = isMobile ? window.innerHeight * 0.4 : window.innerHeight * 0.7;

    // ウィンドウサイズに合わせてカメラのアスペクト比とレンダラーサイズを更新
    renderer.setSize(window.innerWidth, renderHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // ウィンドウサイズに合わせてシーン全体をスケール調整
    const scaleFactor = isMobile ? 0.8 : 1; // モバイルなら少し縮小
    scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
  });

// Firestoreからデータを取得して本のテクスチャを更新する関数（例）
async function updateBooksFromFirestore() {
  const firestoreData = [
    // Firestoreから取得した画像URLを仮で設定
    'https://via.placeholder.com/100x150?text=Updated+Book+1',
    'https://via.placeholder.com/100x150?text=Updated+Book+2',
    'https://via.placeholder.com/100x150?text=Updated+Book+3',
    'https://via.placeholder.com/100x150?text=Updated+Book+4',
    'https://via.placeholder.com/100x150?text=Updated+Book+5'
  ];

  books.forEach((book, index) => {
    const newTexture = new THREE.TextureLoader().load(firestoreData[index % firestoreData.length]);
    book.material.map = newTexture;
    book.material.needsUpdate = true;
  });
}
