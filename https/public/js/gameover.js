/* Copyright 2018, Anthony Pecoraro. All Rights Reserved */

class DOM {
    constructor(a, b, c, d, e) {
        this.input = document.getElementById(a);
        this.form = document.getElementById(b);
        this.score = document.getElementById(c);
        this.name = document.getElementById(d);
        this.prompt = document.getElementById(e);
        this.code = "";
    }
    animateValidationSuccess(a, b) {
        if (b.includes("prof")) this.name.textContent = "Player 1";
        else this.name.textContent = a;

        this.prompt.textContent = b;
        this.input.value = "";
    }
    animateValidationError(a) {
        this.input.value = "";
        this.prompt.textContent = a;
    }
    setScore() {
        let uri = window.location.href;
        let uriSplit = uri.split("?");
        this.code = uriSplit[1];
        let num = (uriSplit[2]) ? uriSplit[2] : "???";
        this.score.textContent = num;
    }
}

async function validateScore(data) {
    return await fetch("/validate-score", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(data)
    });
}

// Instantiations
let mrDom = new DOM("input", "boardForm", "score", "name", "prompt");

// Listener
mrDom.form.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    let name = input.value;
    let response = await validateScore({Id: mrDom.code, Name: input.value});
    let text = await response.text();

    if (response.status === 200) {
        mrDom.animateValidationSuccess(name, text)
    } else {
        mrDom.animateValidationError("An Error Occured!");
    }
});

// On Load
window.onload = async () => {
    mrDom.setScore();
}