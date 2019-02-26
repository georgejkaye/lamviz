/**
 * Functions related to the gallery page, such as processing input or changing elements.
 * 
 * @author George Kaye
 */

var currentTerm;
var originalTerm;
var reduced = false;

var freeVariables = new LambdaEnvironment();

var terms;
var cys;
var ctx;
var currentTermNo = 0;
var termString = "";
var totalNumber = 0;

var n = 0;
var k = 0;
var cross = 0;
var abs = 0;
var apps = 0;
var vars = 0;
var betas = 0;
var fragment = "";

var lastAction = 0;

/**
 * Action to perform when a generate button is performed.
 * @param {number} x - The identifier for the type of terms to generate.
 * @param {number} n - A previously specified n (optional).
 * @param {number} k - A previously specified k (optional).
 */
function generateButton(x, prev){

    changeText("normalisation-studio", "");

    if(!prev){
        n = parseInt(getText('n'));
        k = parseInt(getText('k'));
        cross = parseInt(getText('crossings'));
        apps = parseInt(getText('applications'));
        abs = parseInt(getText('abstractions'));
        vars = parseInt(getText('variables'));
        betas = parseInt(getText('betas'));
        lastAction = x;
    }

    var string = "";

    if(isNaN(n)){
        string = "Bad input";
    } else {

        if(isNaN(k)){
            k = 0;
        }

        if(!prev){
            fragment = "";
            terms = [];
            cys = [];
            freeVariables = new LambdaEnvironment();

            for(var i = 0; i < k; i++){
                freeVariables.pushTerm(i);
            }

            switch(lastAction){
                case 0:
                    terms = generateTerms(n, k);
                    fragment = "pure";
                    break;
                case 1:
                    terms = generateLinearTerms(n, k);
                    fragment = "linear";
                    break;
                case 2:
                    terms = generatePlanarTerms(n, k);
                    fragment = "planar";
                    break;
            }

            totalNumber = terms.length;
        }

        if(!isNaN(cross)){
            terms = terms.filter(x => x.crossings() === cross);
        }

        if(!isNaN(apps)){
            terms = terms.filter(x => x.applications() === apps);
        }
        
        if(!isNaN(abs)){
            terms = terms.filter(x => x.abstractions() === abs);
        }
        
        if(!isNaN(vars)){
            terms = terms.filter(x => x.crossings() === vars);
        }

        if(!isNaN(betas)){
            terms = terms.filter(x => x.betaRedexes() === betas);
        }

        var filteredNumber = terms.length;

        termString = "";

        for(i = 0; i < terms.length; i++){

            terms[i].generatePrettyVariableNames(freeVariables);

            var x = terms[i].prettyPrintLabels().length;
            var size = 200;

            while(x > 20){
                size -= 2;
                x--;
            }

            var termName = "";

            if(document.getElementById('de-bruijn').checked){
                termName = terms[i].prettyPrint();
            } else {
                termName = printTermHTML(terms[i]);
            }

            var caption = getP("caption", "portrait-caption-" + i, "font-size:" + size + "%", "", termName + "<br>" + terms[i].crossings() + " crossings");

            if(document.getElementById("draw").checked){
                termString += getDiv('w3-container frame', 'frame' + i, "", 'viewPortrait(terms[' + i + ']);', 
                            getDiv("w3-container inner-frame", "", "", "", getDiv("w3-container portrait", "portrait" + i, "", "", "")) + "<br>" + 
                                caption);            
 
            } else {
                termString += getDiv('w3-container frame empty', 'frame ' + i, "", 'viewPortrait(terms[' + i + ']);', caption);
            }
        }

        changeText('church-room', termString);

        var numString = "There ";
        
        if(totalNumber === 1){
            numString += "is 1 " + fragment + " term";
        } else {
            numString += "are " + totalNumber + " " + fragment + " terms"; 
        }

        numString += " for n = " + n + " and k = " + k + "<br>" +
                        filteredNumber + "/" + totalNumber + " term";

        if(terms.length !== 1){
            numString += "s";
        }

        var percentage = 0;

        if(totalNumber != 0){
            percentage = (filteredNumber / totalNumber) * 100;
        }

        changeText('number-of-terms', numString + " match the filtering criteria: "  + percentage.toFixed(2) + "%");
        changeText('help', "Click on a term to learn more about it.")

        ctx = new LambdaEnvironment();

        for(var i = 0; i < k; i++){
            ctx.pushTerm("f" + i, lambda + "f" + i + ".");
        }

        drawGallery(false, terms, ctx);

    }

}

/**
 * Draw a gallery of generated terms.
 * @param {boolean} cache - If the terms have previously been generated.
 * @param {terms}   terms - The terms in the gallery.
 * @param {ctx}     ctx   - The context of the gallery.
 */
function drawGallery(cache, terms, ctx){
    
    if(document.getElementById("draw").checked){
        if(cache){
            for(var i = 0; i < terms.length; i++){
                drawMap("portrait" + i, terms[i], ctx, false, false, false);
            }
        }
        
        for(var i = 0; i < terms.length; i++){
            cys[i] = drawMap("portrait" + i, terms[i], ctx, false, false, false);
        }
    }
}

var a = 0;

/**
 * Function to execute when the clear button is pressed.
 */
function clearButton(){
    changeText('church-room', "");
    changeText('number-of-terms', "");
    changeText('normalisation-studio', "");
    changeValueClass('number-box', "");
}


/**
 * Function to execute when a portrait is clicked.
 * @param term - The term to draw.
 */
function viewPortrait(term){

    currentTerm = term;

    var disabled = '';

    if(!currentTerm.hasBetaRedex()){
        disabled = 'disabled';
    }

    changeText("church-room", '<table>' +
                                    '<tr>' +
                                        '<td>' + getDiv("w3-container frame big-frame", "frame" + i, "", "", getDiv("w3-container portrait", "portrait" + i, "", "", "")) + '</td>' +
                                        '<td>' +
                                            '<table>' + 
                                                getRow(getCell("term-heading", '<b>' + printTermHTML(currentTerm) + '</b>')) +
                                                getRow(getCell("term-subheading", '<b>' + currentTerm.prettyPrint() + '</b>')) +
                                                getRow(getCell("term-fact", 'Crossings: ' + currentTerm.crossings())) +
                                                getRow(getCell("term-fact", 'Abstractions: ' + currentTerm.abstractions())) +
                                                getRow(getCell("term-fact", 'Applications: ' + currentTerm.applications())) +
                                                getRow(getCell("term-fact", 'Variables: ' + currentTerm.variables())) +
                                                getRow(getCell("term-fact", 'Free variables: ' + currentTerm.freeVariables())) +
                                                getRow(getCell("term-fact", 'Beta redexes: ' + currentTerm.betaRedexes())) +
                                                getRow(getCell("term-fact", bulletsOfArray(currentTerm.printRedexes(), "redex", "clickRedex(i)", "highlightRedex(i)", "unhighlightRedex(i)"))) +
                                                getRow(getCell("", '<button type = "button" disabled id = "reset-btn" onclick = "resetButton();">Reset</button><button type = "button" id = "back-btn" onclick = "backButton();">Back</button>')) +
                                                getRow(getCell("", '<button type = "button" id = "norm-btn" onclick = "showNormalisationGraph();">View normalisation graph</button>')) +   
                                            '</table>' +
                                        '</td>' +
                                    '</tr>' +
                                '</table>'
    )

    drawMap('portrait' + i, currentTerm, ctx, true, true, false);
}

/**
 * Function to execute when the back button is pressed.
 */
function backButton(){
    changeText('normalisation-studio', "");
    generateButton(lastAction, true);
    reduced = false;
}

/**
 * Function to execute when the reset button is pressed.
 */
function resetButton(){
    changeText('normalisation-studio', "");
    if(reduced && currentTerm !== originalTerm){
        viewPortrait(originalTerm);
        reduced = false;
    } else { 
        document.getElementById("reset-btn").disabled = true; 
    }
}

/**
 * Function to execute when a reduce button is pressed.
 * @param {number} strat - The reduction strategy to use: 0: outermost, 1: innermost
 */
function reduceButton(strat){

    var normalisedTerm;
    
    switch(strat){
        case 0:
            normalisedTerm = outermostReduction(currentTerm);
            break;
        case 1:
            normalisedTerm = innermostReduction(currentTerm);
            break;
    }
    
    if(!reduced){
        reduced = true;
        originalTerm = currentTerm;
    }

    viewPortrait(normalisedTerm);
    document.getElementById("reset-btn").disabled = false; 

}

/**
 * Highlight a redex.
 * @param {number} i - The redex to highlight.
 */
function highlightRedex(i){

    var colour = "";

    switch(i % 5){
        case 0:
            colour += "red";
            break;
        case 1:
            colour += "orange";
            break;
        case 2:
            colour += "green";
            break;
        case 3:
            colour += "blue";
            break;
        case 4:
            colour += "violet";
            break;
    }

    setStyleSpan("beta-" + i, "color:" + colour);
    highlightClass("beta-" + i, colour);

}

/**
 * Unhighlight an already highlighted redex.
 * @param {number} i - The redex to unhighlight.
 */
function unhighlightRedex(i){

    setStyleSpan("beta-" + i, "color:black");
    highlightClass("beta-" + i);

}

/**
 * Function to execute when you click a redex.
 * @param {number} i - The redex clicked.
 */
function clickRedex(i){

    var normalisedTerm = specificReduction(currentTerm, i)[0];

    if(!reduced){
        reduced = true;
        originalTerm = currentTerm;
    }

    viewPortrait(normalisedTerm);
    document.getElementById("reset-btn").disabled = false;
}

/**
 * Show the normalisation graph for the current term.
 */
function showNormalisationGraph(){

    var reductions = generateReductionTree(currentTerm);  

    changeText('normalisation-studio', getDiv("w3-container frame graph-frame", "normalisation-graph-frame", "", "", getDiv("w3-container portrait", "normalisation-graph", "", "", "")));
    drawNormalisationGraph("normalisation-graph", currentTerm, freeVariables);

    document.getElementById("reset-btn").disabled = false;

}