export default (askUser, categories, userAnswers, usersQuestionCategory, pageControl) => {
    let storeName = [
            "roadSurfaceMarking",
            "roadRules",
            "lightVehicleControls",
            "heavyVehicleControls",
            "warningSigns"
        ],
        name = 'LLT',
        version = 1,
        dbReq;

    "indexedDB" in window ?
        dataAvailable() :
        notSupported()

    function notSupported() {
        alert("IndexedDB not supported by you device, this web-app won't perform as expected.")
    }

    function dataAvailable() {
        switch (JSON.parse(localStorage.getItem('data_available'))) {
            case true:
                askQuestion();
                break
            default:
                createDB();
                localStorage.setItem('data_available', JSON.stringify(true));
                localStorage.setItem("left_at", JSON.stringify({
                    category: "roadRules",
                    id: 1
                }));
                break
        }
    }

    function createDB() {
        dbReq = indexedDB.open(name, version);

        dbReq.onerror = () => {
            console.error(`Bothata ka database papa: ${dbReq.error}`);
        }

        dbReq.onblocked = () => {
            // there's another connection to same database
            // and it wasn't closed  AFTER db.onversionchange triggered frpm them.
            alert("there's another coonnection to same database, YOU MIGHT BEING HACKED !!!");
        }

        dbReq.onupgradeneeded = () => {
            // gets triggred if client had no database 
            // initialise you're object stores
            let db = dbReq.result;
            for (let store of storeName) {
                if (!db.objectStoreNames.contains(store)) {
                    let storeObj = db.createObjectStore(store, {
                        keyPath: "id",
                        autoIncrement: true
                    });

                    storeObj.createIndex('CTA', 'category');

                }
            }
        }

        dbReq.onsuccess = () => {
            // continue to work with you're database.
            let db = dbReq.result;
            db.onversionchange = () => {
                db.close();
                alert("Database is outdated, please reload page.")
            }
            fixImagesFirst();
        }

    }

    async function fixImagesFirst() {

        let db = dbReq.result,
            storeNames = [...db.objectStoreNames],
            category = null;
        try {
            for await (let name of storeNames) {
                // console.log(category.roadSurfaceMarking)
                if (categories.has(name)) {
                    category = categories.get(name)

                    category.forEach(question => {
                        if (!question.imgSrc.includes("not available")) {
                            question.imgSrc.map(async (img, index) => {
                                let blob;
                                try {
                                    blob = await img;
                                    question.imgSrc[index] = await blob;
                                    await populateStores(question);

                                } catch (err) {
                                    // console.error(`Bothata ke bo: ${err}`);
                                }
                            })
                        } else {
                            populateStores(question);
                        }
                    })

                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    function populateStores(...category) {
        let db = dbReq.result,
            storeNames = [...db.objectStoreNames];

        for (let name of storeNames) {
            let transaction = db.transaction(name, "readwrite");
            transaction.oncomplete = () => {
                // console.log("Transaction compelete");
                // db.close();
            };
            transaction.onabort = () => {
                // console.error("I couldn't do what you want, so ama-bounce ...");
                // console.error(transaction.error);
            }
            transaction.onerror = () => {
                // console.error(`Bothata ke bo: ${transaction.error}`);
            }

            let store = transaction.objectStore(name);
            for (let question of category) {

                switch (question.category) {
                    case store.name:
                        let req = store.add(question);
                        req.onsuccess = () => {
                            // console.log(`Question add to ${store.name} objectStore`);
                        }
                        req.onerror = e => {
                            if (req.error.name === "ConstrinatError") {
                                // console.log(`Question with same key id already exists`)
                            } else {
                                // console.log(`Bothata ke bo: ${transaction.error}`);
                                //   transaction will abort
                            }
                        }
                        break
                }
            }
        }
        askQuestion();
    }

    function askQuestion(x = null) {
        let current = JSON.parse(localStorage.getItem("left_at")),
            storeName = current.category,
            req = indexedDB.open(name);

        req.onsuccess = () => {
            let db = req.result,
                store = db.transaction(storeName).objectStore(storeName),
                id = x || current.id,
                query = store.get(id),
                count = store.count();

            // total questions in the objectStore
            count.onsuccess = () => {
                localStorage.setItem("numberOfQs", JSON.stringify(count.result));
                let x = questionsLeft();
                pageControl.children[0].textContent = questionsLeft();
            };

            query.onsuccess = e => {
                let res = query.result,
                    answers = [...userAnswers.children];

                sessionStorage.setItem("voetsek", res.correct);

                askUser[0].children[0].textContent = res.question.toUpperCase();

                if (Array.isArray(res.imgSrc)) {
                    askUser[1].style.display = "block";
                    // create a bug, two images can't be shown at sametime.
                    // I may may have sorted it.
                    let oldImgs = document.querySelectorAll(".img");
                    oldImgs.forEach(image => {
                        askUser[1].removeChild(image);
                    });
                    res.imgSrc.forEach(blob => {
                        let url = URL.createObjectURL(blob),
                            img = new Image();
                        img.src = url;
                        img.style.width = '100%';
                        img.style.maxHeight = '400px';
                        img.classList.add("img");
                        askUser[1].appendChild(img);
                    })
                } else {
                    askUser[1].style.display = 'none';
                }

                answers.filter(val => val.classList.contains("ans")).forEach((checkBox, index) => {

                    checkBox.children[0].value = res.answers[index];
                    checkBox.children[1].innerText = res.answers[index];

                });
            }

            query.onerror = () => {
                console.error(`Bothta ke bo: ${query.error}`);
            }

        }
        req.onblocked = () => {
            // there's another connection to same database
            // and it wasn't closed  AFTER db.onversionchange triggered frpm them.
            alert("there's another coonnection to same database, YOU MIGHT BEING HACKED !!!");
        }

        userAnswers.onsubmit = e => {
            e.preventDefault();
            let diKarabo = [...e.target.elements];
            // retrives the last checked answer
            let karabo = diKarabo.reduce((cur, nxt) => {
                if (nxt.checked) cur.x = nxt.value;
                return (cur);
            }, {});
            answerCorrect(karabo);
            //clears all the checked answer(s)
            diKarabo.forEach(x => x.checked = false);
        }

        usersQuestionCategory.onchange = e => {
            if (!e.target.value.includes(storeName)) {
                //    find a way to change the question id
                setLeftAt(e.target.value, 1);
                askQuestion();
            }
        }

    }

    function answerCorrect(answer) {
        // check if selected answer from endUserAnswers is correct,
        // if correct get the next question to the endUser.

        let correct = new RegExp(sessionStorage.getItem("voetsek"), 'i');

        if (correct.test(answer['x'])) {
            // console.log(correct.test(answer['x']));
            //    get new question.
            
            let x = getLeftAt();
            setLeftAt(x.category, x.id + 1);
            askQuestion();
        } else {
            alert(`INCORRECT ANSWER.
TRY AGAIN!`)
        }
    }

    function setLeftAt(x, y) {
        localStorage.setItem("left_at", JSON.stringify({
            category: x,
            id: y
        }));
    }
    function getLeftAt(){
        let x = JSON.parse(localStorage.getItem("left_at"));
        return(x);
    }

    function questionsLeft() {
        let total = JSON.parse(localStorage.getItem('numberOfQs')),
            cur = JSON.parse(localStorage.getItem("left_at"));
        cur = cur.id;
        return('question '+ cur + '/' + total)
    }

}