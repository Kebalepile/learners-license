export default () => {
    const article = document.createElement("article"),
        header = document.createElement("h1"),
        br = document.createElement('br'),
        version = document.createElement('h3'),
        createdBy = document.createElement('h4'),
        author = document.createElement('h4'),
        description = document.createElement('h4'),
        strong = document.createElement('strong'),
        p = document.createElement('p');
    header.textContent = "About app";
    version.textContent = "Version: 0.0.1";
    createdBy.textContent = "Created by:";
    strong.textContent = "K.T Motshoana";
    author.appendChild(strong);
    description.textContent = "description:";
    p.textContent = "A learners licence test web app for primarily code 2 and code 3";
    article.classList.add('about');
    [header, br, version, br, createdBy, br, author, br, br, description, br, p].forEach(val => article.appendChild(val))

    document.body.appendChild(article);
    article.onclick = e => {
        document.body.removeChild(article);
        document.querySelector("#about").disabled = false;
    }

};