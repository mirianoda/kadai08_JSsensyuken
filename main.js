// 必要なFirebaseライブラリをインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged} 
from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, getDocs, updateDoc, arrayUnion} 
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

//APIキーを設定
const apiKey = "";  // TMDBのAPIキーを設定
const BookapiKey = "";  // GoogleBooksのAPIキーを設定

//TMDBで映画情報を取得する関数
async function fetchMovieDetails(mediaId) {
      //詳細情報を取得するリクエスト
      const detailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${mediaId}?api_key=${apiKey}&append_to_response=credits&language=ja`);
      const detailsData = await detailsResponse.json();
      
      // 必要な情報を取得
      const title = detailsData.title || detailsData.name;
      const overview = detailsData.overview;
      const releaseDate = detailsData.release_date || detailsData.first_air_date;
      const country = detailsData.production_countries?.[0]?.name;
      const genres = detailsData.genres.map(genre => genre.name).join(", ");
      const runtime = detailsData.runtime || detailsData.episode_run_time?.[0];
      const posterPath = `https://image.tmdb.org/t/p/w500${detailsData.poster_path}`;
      
      // キャスト情報を取得（上位5名を表示）
      const cast = detailsData.credits.cast.slice(0, 5).map(actor => actor.name).join(", ");
      
      console.log(`タイトル: ${title}`);
      console.log(`あらすじ: ${overview}`);
      console.log(`公開日: ${releaseDate}`);
      console.log(`国: ${country}`);
      console.log(`ジャンル: ${genres}`);
      console.log(`尺: ${runtime} 分`);
      console.log(`キャスト: ${cast}`);
      console.log(`ポスター: ${posterPath}`);
      
      return {
        title,
        overview,
        releaseDate,
        country,
        genres,
        runtime,
        cast,
        posterPath
      };
  };

//TMDBでドラマ情報を取得する関数
async function fetchDramaDetails(mediaId) {
      //詳細情報を取得するリクエスト
      const detailsResponse = await fetch(`https://api.themoviedb.org/3/tv/${mediaId}?api_key=${apiKey}&append_to_response=credits&language=ja`);
      const detailsData = await detailsResponse.json();
      
      // 必要な情報を取得
      const title = detailsData.title || detailsData.name;
      const overview = detailsData.overview;
      const releaseDate = detailsData.release_date || detailsData.first_air_date;
      const country = detailsData.production_countries?.[0]?.name;
      const genres = detailsData.genres.map(genre => genre.name).join(", ");
      const runtime = detailsData.episode_run_time[0];
      const posterPath = `https://image.tmdb.org/t/p/w500${detailsData.poster_path}`;
      
      // キャスト情報を取得（上位5名を表示）
      const cast = detailsData.credits.cast.slice(0, 5).map(actor => actor.name).join(", ");
      
      console.log(`タイトル: ${title}`);
      console.log(`あらすじ: ${overview}`);
      console.log(`公開日: ${releaseDate}`);
      console.log(`国: ${country}`);
      console.log(`ジャンル: ${genres}`);
      console.log(`尺: ${runtime} 分`);
      console.log(`キャスト: ${cast}`);
      console.log(`ポスター: ${posterPath}`);
      
      return {
        title,
        overview,
        releaseDate,
        country,
        genres,
        runtime,
        cast,
        posterPath
      };
  };

//GoogleBookで本情報を取得する関数

async function fetchBookDetails(mediaId) {
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${mediaId}?key=${BookapiKey}`);
  const detailsData = await response.json();

    const title = detailsData.volumeInfo.title;
    const authors = detailsData.volumeInfo.authors?.join(", ");
    const publishedDate = detailsData.volumeInfo.publishedDate;
    const description = detailsData.volumeInfo.description;
    const pageCount = detailsData.volumeInfo.pageCount;
    const categories = detailsData.volumeInfo.categories?.join(", ");
    const imageLinks = detailsData.volumeInfo.imageLinks?.thumbnail;
      
      console.log(`タイトル: ${title}`);
      console.log(`著者: ${authors}`);
      console.log(`出版日: ${publishedDate}`);
      console.log(`ページ数: ${pageCount}`);
      console.log(`ジャンル: ${categories}`);
      console.log(`概要: ${description} `);
      console.log(`画像: ${imageLinks}`);
      
      return {
        title,
        authors,
        publishedDate,
        pageCount,
        categories,
        description,
        imageLinks
      };
  };

// TMDB APIから映画またはドラマの画像URLを取得する関数
async function fetchTmdbImage(id, type) {
  const response = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=ja`);
  const data = await response.json();
  return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
}

// Google Books APIから本の画像を取得する関数
const googleBooksBaseUrl = "https://www.googleapis.com/books/v1/volumes/";
async function fetchBookImage(bookId) {
  const response = await fetch(`${googleBooksBaseUrl}${bookId}`);
  const data = await response.json();
  return data.volumeInfo.imageLinks?.thumbnail || "";
}

//Firestoreから他のユーザーの登録した作品情報を取得する関数（最新が上に）
async function displayTimeline() {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    console.log("ここまではきてる");

    const elements = []; // 画像要素を保存する配列

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      console.log("ユーザーデータ:", data);

      // myBestMovieが存在する場合
      if (data.myBest.myBestMovie) {
        console.log("映画データを取得しています:", data.myBest.myBestMovie);
        const movieImageUrl = await fetchTmdbImage(data.myBest.myBestMovie, "movie");
        if (movieImageUrl) {
          const movieLink = `sakuhin.html?type=movie&id=${data.myBest.myBestMovie}`;
          const movieImgElement = $("<a>")
            .attr("href", movieLink) // 作品の詳細ページへのリンク
            .attr("target", "_self")
            .append($("<img>").attr("src", movieImageUrl).addClass("timeline-image"));
          elements.push(movieImgElement); // 配列に追加
        }
      }

      // myBestDramaが存在する場合
      if (data.myBest.myBestDrama) {
        console.log("ドラマデータを取得しています:", data.myBest.myBestDrama);
        const dramaImageUrl = await fetchTmdbImage(data.myBest.myBestDrama, "tv");
        if (dramaImageUrl) {
          const dramaLink = `sakuhin.html?type=tv&id=${data.myBest.myBestDrama}`;
          const dramaImgElement = $("<a>")
            .attr("href", dramaLink)
            .attr("target", "_self")
            .append($("<img>").attr("src", dramaImageUrl).addClass("timeline-image"));
          elements.push(dramaImgElement);
        }
      }

      // myBestBookが存在する場合
      if (data.myBest.myBestBook) {
        console.log("本データを取得しています:", data.myBest.myBestBook);
        const bookImageUrl = await fetchBookImage(data.myBest.myBestBook);
        if (bookImageUrl) {
          const bookLink = `sakuhin.html?type=book&id=${data.myBest.myBestBook}`;
          const bookImgElement = $("<a>")
            .attr("href", bookLink)
            .attr("target", "_self")
            .append($("<img>").attr("src", bookImageUrl).addClass("timeline-image"));
          elements.push(bookImgElement);
        }
      }
    }

    // すべての画像要素をまとめてタイムラインの先頭に追加
    $("#timeline").prepend(elements);
  } catch (error) {
    console.error("タイムラインのデータ取得エラー:", error);
  }
}




// ホーム
onAuthStateChanged(auth, (user) => {
  if (user) {
    // const userIconUrl = user.photoURL;
    // $("#usericon-btn").attr("src", userIconUrl); //Goorleアカウントの画像を取得し表示

    $(document).ready(function() {
      displayTimeline();
    });//タイムラインに他のユーザーのお気に入り作品を表示
    
    $("#usericon-btn").on("click", function() {
      window.location.href = "user.html"; //ユーザーページに遷移
    });
  } else {
    console.log("ユーザーがログインしていません");
  }
});

// ユーザーページ
// URLパラメータからユーザーIDを取得
function getUserIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("uid");
}

// ユーザー情報を取得して表示する関数
async function displayUserProfile() {
  const userId = getUserIdFromURL() || auth.currentUser.uid;
  const currentUser = auth.currentUser;

  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    $("#username").text(data.userName || "不明なユーザー");
    $("#usericon").attr("src", data.photoURL || "img/user.png");

    // 好きな映画、ドラマ、本のポスター画像を取得
    const myBestMovieId = data.myBest?.myBestMovie;
    const myBestDramaId = data.myBest?.myBestDrama;
    const myBestBookId = data.myBest?.myBestBook;

    // 映画の詳細を取得して画像を設定し、クリックイベントでリンクを追加
    if (myBestMovieId) {
      fetchMovieDetails(myBestMovieId).then(data => {
        $("#myBestMovieIMG").attr("src", data.posterPath).on("click", () => {
          window.location.href = `sakuhin.html?type=movie&id=${myBestMovieId}`;
        });
      });
    }

    // ドラマの詳細を取得して画像を設定し、クリックイベントでリンクを追加
    if (myBestDramaId) {
      fetchDramaDetails(myBestDramaId).then(data => {
        $("#myBestDramaIMG").attr("src", data.posterPath).on("click", () => {
          window.location.href = `sakuhin.html?type=tv&id=${myBestDramaId}`;
        });
      });
    }

    // 本の詳細を取得して画像を設定し、クリックイベントでリンクを追加
    if (myBestBookId) {
      fetchBookDetails(myBestBookId).then(data => {
        $("#myBestBookIMG").attr("src", data.imageLinks).on("click", () => {
          window.location.href = `sakuhin.html?type=book&id=${myBestBookId}`;
        });
      });
    }

    // 他のユーザーのページで、すでに友達かどうかを確認
    if (currentUser.uid !== userId) {
      const currentUserRef = doc(db, "users", currentUser.uid);
      const currentUserSnap = await getDoc(currentUserRef);
      const friends = currentUserSnap.data()?.friends || [];

      if (friends.includes(userId)) {
        // 既に友達の場合
        $("#friendAdd-btn").append("<button>友達追加済み</button>").addClass("friend-button");
      } else {
        // まだ友達でない場合
        const friendButton = $("<button>").text("友達になる").addClass("friend-button").on("click", () => addFriend(userId));
        $("#friendAdd-btn").append(friendButton);
      }
    }
  } else {
    console.log("ユーザー情報が見つかりませんでした");
  }
}


// friendsの情報を取得して表示する関数
async function displayFriends(userId) {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const friends = userData.friends || [];

      const favoriteReasonDiv = document.getElementById("favorite-reason");
      favoriteReasonDiv.innerHTML = ""; // 初期化

      // friendsに格納されている各友達のIDを取得して、情報を表示
      for (const friendId of friends) {
        const friendDocRef = doc(db, "users", friendId);
        const friendDocSnap = await getDoc(friendDocRef);

        if (friendDocSnap.exists()) {
          const friendData = friendDocSnap.data();

          // アイコンとユーザー名を含む要素を作成
          const friendContainer = document.createElement("div");
          friendContainer.className = "friend-container";
          
          // クリックイベントを追加してページ遷移
          friendContainer.addEventListener("click", () => {
            window.location.href = `user.html?uid=${friendId}`;
          });

          const friendIcon = document.createElement("img");
          friendIcon.src = friendData.profileImage || "img/user.png"; 
          friendIcon.alt = `${friendData.userName}'s profile icon`;
          friendIcon.className = "friend-icon";

          const friendName = document.createElement("span");
          friendName.textContent = friendData.userName;
          friendName.className = "friend-name";

          // コンテナにアイコンと名前を追加
          friendContainer.appendChild(friendIcon);
          friendContainer.appendChild(friendName);

          // favorite-reasonに追加
          favoriteReasonDiv.appendChild(friendContainer);
        }
      }
    } else {
      console.log("指定したユーザーが存在しません");
    }
  } catch (error) {
    console.error("友達情報の取得中にエラーが発生しました:", error);
  }
}


// 関数を呼び出してfriendsを表示
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userId = auth.currentUser.uid;
    displayFriends(userId); // UIDが取得できたら、友達を表示する関数を呼び出し
  } else {
    console.log("ユーザーがログインしていません");
  }
});


// Firestoreからリストを取得し、画像を表示する関数
async function displayUserLists() {
  const userId = auth.currentUser.uid;
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const lists = docSnap.data().lists || {};

    // 映画リストの画像を表示
    if (lists.movie) {
      for (const movieId of lists.movie) {
        const imageUrl = await fetchTmdbImage(movieId, "movie");
        if (imageUrl) {
          const linkElement = $("<a>")
            .attr("href", `sakuhin.html?id=${movieId}&type=movie`)
            .addClass("list-link");
          const imgElement = $("<img>").attr("src", imageUrl).addClass("list-image");
          linkElement.append(imgElement);
          $(".display2").append(linkElement);
        }
      }
    }

    // ドラマリストの画像を表示
    if (lists.tv) {
      for (const tvId of lists.tv) {
        const imageUrl = await fetchTmdbImage(tvId, "tv");
        if (imageUrl) {
          const linkElement = $("<a>")
            .attr("href", `sakuhin.html?id=${tvId}&type=tv`)
            .addClass("list-link");
          const imgElement = $("<img>").attr("src", imageUrl).addClass("list-image");
          linkElement.append(imgElement);
          $(".display2").append(linkElement);
        }
      }
    }

    // 本リストの画像を表示
    if (lists.book) {
      for (const bookId of lists.book) {
        const imageUrl = await fetchBookImage(bookId);
        if (imageUrl) {
          const linkElement = $("<a>")
            .attr("href", `sakuhin.html?id=${bookId}&type=book`)
            .addClass("list-link");
          const imgElement = $("<img>").attr("src", imageUrl).addClass("list-image");
          linkElement.append(imgElement);
          $(".display2").append(linkElement);
        }
      }
    }
  } else {
    console.log("ユーザーのリストが見つかりません");
  }
}

// 友達として追加
async function addFriend(friendId) {
  const userId = auth.currentUser.uid;
  const userRef = doc(db, "users", userId);

  try {
    await updateDoc(userRef, {
      friends: arrayUnion(friendId) // Firestoreで友達のIDを追加
    });
    $("#friendAdd-button").text("友達追加ずみ");
  } catch (error) {
    console.error("友達追加に失敗しました:", error);
  }
}

// ユーザーの認証状態を監視
onAuthStateChanged(auth, (user) => {
  if (user) {
    // ユーザーがログインしている場合のみプロフィールを表示
    displayUserProfile();
    displayUserLists();
  } else {
    console.log("ユーザーがログインしていません");
    // 必要であれば、ログインページにリダイレクトするなどの処理を追加
  }
});




