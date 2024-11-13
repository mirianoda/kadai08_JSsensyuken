// 必要なFirebaseライブラリをインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged} 
from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, getDocs, where, updateDoc, arrayUnion} 
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
// Firebaseの初期化
const app = initializeApp(firebaseConfig);
// FirestoreとAuthenticationのインスタンス
const db = getFirestore(app);
const auth = getAuth(app);  // `getAuth(app)`でauthインスタンスを作成

//TMDBのAPIキーを設定
const apiKey = "";  // TMDBのAPIキーを設定

// TMDB APIから映画やドラマの詳細を取得
async function fetchTmdbDetails(id, type) {
    const response = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&append_to_response=credits&language=ja`);
    const data = await response.json();
  
    // 監督と脚本家の情報を取得
    const director = data.credits.crew.find(member => member.job === "Director")?.name || "ー";
    const writers = data.credits.crew
      .filter(member => member.job === "Writer" || member.job === "Screenplay")
      .map(writer => writer.name)
      .join(", ") || "ー";

    // 尺（runtime）をタイプによって変更
    const runtime = type === "tv" 
    ? `全${data.number_of_episodes || "ー"} 話` 
    : `${data.runtime || "ー"} 分`;
  
    return {
      title: data.title || data.name,
      releaseDate: data.release_date || data.first_air_date,
      runtime: runtime,
      country: data.production_countries?.[0]?.name || "",
      genre: data.genres?.map(g => g.name).join(", ") || "",
      cast: data.credits.cast.slice(0, 5).map(c => c.name).join(", ") || "ー",
      overview: data.overview || "ー",
      director: director,
      writers: writers,
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "" // ポスター画像URL
    };
  }
  
  // Google Books APIから本の詳細を取得
  async function fetchBookDetails(bookId) {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
    const data = await response.json();
    return {
      title: data.volumeInfo.title || "ー",
      releaseDate: data.volumeInfo.publishedDate || "",
      runtime: `${data.volumeInfo.pageCount || ""} ページ`,
      genre: data.volumeInfo.categories?.join(", ") || "",
      overview: data.volumeInfo.description || "ー",
      cast: "ー", // 本にはキャスト情報がない
      country: "", // 国情報がない場合
      writers: "ー", // 本には監督がいない
      director: data.volumeInfo.authors?.join(", ") || "ー", // 著者情報を脚本家として表示
      poster: data.volumeInfo.imageLinks?.thumbnail || "" // 本の画像URL
    };
  }

  // MyBestに作品を設定しているユーザーを取得して表示
async function displayUsersWithMyBest() {
    const { id, type } = getParams();
    if (!id || !type) return console.log("IDまたはタイプが指定されていません");
  
    const myBestField = type === "movie" ? "myBest.myBestMovie" 
                        : type === "tv" ? "myBest.myBestDrama" 
                        : "myBest.myBestBook";
  
    try {
      // Firestoreクエリを使用して、特定の作品をMyBestに設定しているユーザーを取得
      const q = query(collection(db, "users"), where(myBestField, "==", parseInt(id)));
      const querySnapshot = await getDocs(q);
  
      $("#user-icons").empty(); // コンテナをクリア
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const userName = data.userName || "不明なユーザー";
        const userIcon = data.photoURL || "img/user.png";
        const userId = doc.id; // ユーザーIDを取得
  
        // ユーザー情報の要素を作成して表示
        const userElement = $("<div>").addClass("user-info");
        const imgElement = $("<img>")
          .attr("src", userIcon)
          .attr("alt", userName)
          .addClass("user-icon")
          .on("click", () => {
            window.location.href = `user.html?uid=${userId}`; // プロフィールページに遷移
          });
        const nameElement = $("<span>").text(userName);        
  
        userElement.append(imgElement).append(nameElement);
        $("#user-icons").append(userElement);
      });
  
      if (querySnapshot.empty) {
        $("#user-icons").append("<p>この作品をMyBestに設定しているユーザーはいません。</p>");
      }
    } catch (error) {
      console.error("ユーザー情報の取得に失敗しました:", error);
    }
  }

  // URLパラメータから作品IDとタイプを取得
function getParams() {
    const params = new URLSearchParams(window.location.search);
    return { id: params.get("id"), type: params.get("type") };
  }
  
  // 作品情報を取得して表示
  async function displayWorkDetails() {
    const { id, type } = getParams();
    if (!id || !type) return console.log("IDまたはタイプが指定されていません");
  
    const data = type === "book" ? await fetchBookDetails(id) : await fetchTmdbDetails(id, type);
    if (!data) return;

    // 作品のタイプを判定して表示
    const typeLabel = type === "movie" ? "映画" : type === "tv" ? "テレビ番組" : "本";
    $("#type").text(typeLabel);
  
    // 取得したデータをHTMLに挿入
    $("#title").text(data.title || "ー");
    $("#koukaibi").text(data.releaseDate+"公開、" || "");
    $("#length").text(data.runtime+"、" || "");
    $("#country").text(data.country+"、" || "");
    $("#genre").text(data.genre || "");
    $("#cast").text(data.cast || "ー");
    $("#story").text(data.overview || "ー");
    $("#kantoku").text(data.director || "ー");
    $("#kyakuhon").text(data.writers || "ー");
    $("#poster").attr("src", data.poster || "");
  }

  // 気になるリストに追加する関数
  //映画
async function addListMovie(Id) {
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);

    try {
          await updateDoc(userRef, { "lists.movie": arrayUnion(Id) });
          console.log("映画データを保存しました");
          $("#listAdd-btn").text("気になるリストに追加済み");
      } catch (error) {
        console.error("データの保存に失敗しました:", error);
      }
  }
  //テレビ
async function addListDrama(Id) {
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);

    try {
          await updateDoc(userRef, { "lists.drama": arrayUnion(Id) });
          console.log("テレビデータを保存しました");
          $("#listAdd-btn").text("気になるリストに追加済み");
      } catch (error) {
        console.error("データの保存に失敗しました:", error);
      }
  }
  //本
async function addListBook(Id) {
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);

    try {
          await updateDoc(userRef, { "lists.book": arrayUnion(Id) });
          console.log("映画データを保存しました");
          $("#listAdd-btn").text("気になるリストに追加済み");
      } catch (error) {
        console.error("データの保存に失敗しました:", error);
      }
  }

  displayWorkDetails();
  displayUsersWithMyBest();

  // ユーザーの認証状態を監視
    onAuthStateChanged(auth, async function(user){
    const currentUserRef = doc(db, "users", auth.currentUser.uid);
    const currentUserSnap = await getDoc(currentUserRef);
    const lists = currentUserSnap.data()?.lists || { movie: [], tv: [], book: [] }; // listsがない場合に空のリストを設定
    const { id, type } = getParams();

    console.log(type);

    if(type == "movie"){
        const movieList = lists.movie;
        if (user) {
            if (movieList.includes(id)) {
                // 既にリスト追加ずみの場合
                $("#listAdd-btn").text("気になるリストに追加済み");
              }else{
              //気になるリストに追加ボタンを押したら、リストに追加
              $("#listAdd-btn").on("click", () => addListMovie(id));
              }
        } else {
          console.log("ユーザーがログインしていません");
        }
    }else if(type == "tv"){
        const tvList = lists.drama;
        if (user) {
            if (tvList.includes(id)) {
                // 既にリスト追加ずみの場合
                $("#listAdd-btn").text("気になるリストに追加済み");
              }else{
              //気になるリストに追加ボタンを押したら、リストに追加
              $("#listAdd-btn").on("click", () => addListDrama(id));
              }
        } else {
          console.log("ユーザーがログインしていません");
        }
    }else if(type == "book"){
        const bookList = lists.book;
        if (user) {
            if (bookList.includes(id)) {
                // 既にリスト追加ずみの場合
                $("#listAdd-btn").text("気になるリストに追加済み");
              }else{
              //気になるリストに追加ボタンを押したら、リストに追加
              $("#listAdd-btn").on("click", () => addListBook(id));
              }
        } else {
          console.log("ユーザーがログインしていません");
        }
    }
  });


  //左矢印を押したら、前画面に戻る
  $(".hidari").on("click", function() {
    window.history.back();
  });



