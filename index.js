// 必要なFirebaseライブラリをインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp,updateDoc } 
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

// ログイン処理
$(document).ready(function() {
  $("#startbtn,#login").on("click", function() {
    // Googleプロバイダーのインスタンスを作成
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    // Googleでログイン
    signInWithPopup(auth, provider)  // `auth`を渡す
      .then((result) => {
        const user = result.user;
        if (user) {
          // Firestoreでユーザーの存在確認
          const userRef = doc(db, "users", user.uid);  // Firestoreのドキュメント参照を取得
          getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
              // 既存のユーザー -> ホーム画面に移動
              window.location.href = "home.html";
            } else {
              // 新規ユーザー -> Firestoreにユーザー情報を登録して、ユーザー情報登録画面に移動
              setDoc(userRef, {
                displayName: user.displayName,
                email: user.email,
                createdAt: serverTimestamp(),
              }).then(() => {
                window.location.href = "touroku1.html";  // 登録画面にリダイレクト
              });
            }
          }).catch((error) => {
            console.error("ユーザーのチェックに失敗しました:", error);
          });
        }
      }).catch((error) => {
        console.error("Googleログインエラー:", error);
      });
  });
});

//touroku1.html
let movieId,dramaId,bookId;


$(document).ready(function() {
  $(".form1-next").on("click", function() {
    const userName = $("#user-name").val();
    const nendai = $("#nendai").val();
    const seibetu = $("#seibetu").val();

    // ログイン中のユーザーの情報を取得し、Firestoreにデータを保存
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        try {
          await updateDoc(userRef, {
            userName: userName,
            nendai: nendai,
            seibetu: seibetu
          });
          // 次の画面（touroku2.index）に遷移
          window.location.href = "touroku2.html";
        } catch (error) {
          console.error("データの保存に失敗しました:", error);
        }
      } else {
        console.log("ユーザーがログインしていません");
      }
    });
  });
});

//touroku2.html
const apiKey = "";
$(document).ready(function() {

 // いちばん好きな映画入力時
$("#mybestmovie").on("input", function() {
  const query = $(this).val();

  if (query.length > 1) {
    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=ja`)
      .then(response => response.json())
      .then(data => {
        $("#dropdown").empty().hide();

        if (data.results) {
          data.results.slice(0, 5).forEach(movie => {
            const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : "年不明";
            const item = $("<div>")
              .addClass("dropdown-item")
              .text(`${movie.title} (${releaseYear})`) // 映画タイトルと公開年を表示
              .data("movieId", movie.id);
            $("#dropdown").append(item);
          });

          if (data.results.length > 0) {
            $("#dropdown").show();
          }
        }
      })
      .catch(error => console.error("検索エラー:", error));
  } else {
    $("#dropdown").empty().hide();
  }
});

    // 候補がクリックされたときに詳細情報を取得して表示
    $("#dropdown").on("click", ".dropdown-item", function() {
      movieId = $(this).data("movieId");
      const movieTitle = $(this).text();

    // 選択した映画名を入力欄にセット
    $("#mybestmovie").val(movieTitle);
    $("#dropdown").hide(); // ドロップダウンを非表示
    $("#dropdown").empty().hide();

    // ドロップダウンと入力フィールドをクリア
    $("#dropdown").empty().hide();
    $("#movie-input").val("");
    })
  });

  // クリック以外でドロップダウンを非表示にする
  $(document).on("click", function(e) {
    if (!$(e.target).closest("#movie-input").length && !$(e.target).closest("#dropdown").length) {
      $("#dropdown").hide();
    }
  });

  // いちばん好きなドラマ入力時
$("#mybestdrama").on("input", function() {
  const query = $(this).val();

  if (query.length > 1) {
    fetch(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=ja`)
      .then(response => response.json())
      .then(data => {
        $("#tv-dropdown").empty().hide();

        if (data.results) {
          data.results.slice(0, 5).forEach(show => {
            const releaseYear = show.first_air_date ? show.first_air_date.slice(0, 4) : "年不明";
            const item = $("<div>")
              .addClass("dropdown-item")
              .text(`${show.name} (${releaseYear})`) // ドラマタイトルと公開年を表示
              .data("showId", show.id);
            $("#tv-dropdown").append(item);
          });

          if (data.results.length > 0) {
            $("#tv-dropdown").show();
          }
        }
      })
      .catch(error => console.error("ドラマ検索エラー:", error));
  } else {
    $("#tv-dropdown").empty().hide();
  }
});


  // ドラマ候補がクリックされたときに入力欄に表示し、詳細情報を取得して表示
  $("#tv-dropdown").on("click", ".dropdown-item", function() {
    dramaId = $(this).data("showId");
    const showTitle = $(this).text();

    $("#mybestdrama").val(showTitle);
    $("#tv-dropdown").hide();
  });

 // いちばん好きな本入力時
$("#mybestbook").on("input", function() {
  const query = $(this).val();

  if (query.length > 1) {
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=ja`)
      .then(response => response.json())
      .then(data => {
        $("#book-dropdown").empty().hide();

        if (data.items) {
          data.items.slice(0, 5).forEach(book => {
            const authors = book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "著者不明";
            const item = $("<div>")
              .addClass("dropdown-item")
              .text(`${book.volumeInfo.title} - 著者: ${authors}`) // 本タイトルと著者を表示
              .data("bookId", book.id);
            $("#book-dropdown").append(item);
          });

          if (data.items.length > 0) {
            $("#book-dropdown").show();
          }
        }
      })
      .catch(error => console.error("本の検索エラー:", error));
  } else {
    $("#book-dropdown").empty().hide();
  }
});


// 候補がクリックされたときに入力欄に表示し、詳細情報を取得して表示
$("#book-dropdown").on("click", ".dropdown-item", function() {
  bookId = $(this).data("bookId");
  const bookTitle = $(this).text();

  $("#mybestbook").val(bookTitle);
  $("#book-dropdown").hide();
});

// クリック以外でドロップダウンを非表示にする
$(document).on("click", function(e) {
  if (!$(e.target).closest("#book-input").length && !$(e.target).closest("#book-dropdown").length) {
    $("#book-dropdown").hide();
  }
});

  $(".form2-next").on("click", function() {
    const myBestMovie = movieId;
    const myBestDrama = dramaId;
    const myBestBook = bookId;
    const myBestContent = $("#mybestcontent").val();
    const myBestMovie_reason = $("#mybestmovie-reason").val();
    const myBestDrama_reason = $("#mybestdrama-reason").val();
    const myBestBook_reason = $("#mybestbook-reason").val();

    // ログイン中のユーザーの情報を取得し、Firestoreにデータを保存
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        try {
          await updateDoc(userRef, {
            myBest:{myBestMovie: myBestMovie,
                    myBestDrama: myBestDrama,
                    myBestBook: myBestBook},
            myBestContent: myBestContent
        });
          // ホーム画面に遷移
          window.location.href = "home.html";
        } catch (error) {
          console.error("データの保存に失敗しました:", error);
        }
      } else {
        console.log("ユーザーがログインしていません");
      }
    });
  });

  $(".form2-back").on("click",function(){
    window.location.href = "touroku1.html";
  });

