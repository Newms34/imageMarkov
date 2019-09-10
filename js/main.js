var sz = 'small',
    imgUrls = [],
    canvas = document.getElementById('canv'),
    currImg = new Image(),
    currPxData,
    imNum = 0,
    imgArr = [],
    pxGrpSize = 2,
    markObjs = {},
    markLen = 5000,
    currMarkNum = 0,
    fullMarks = '',
    goodBad = [0, 0];

//imgArr is an array holding the  objects which represent each pixel.
//pxGrpSize is how many pixels we group together as the markov 'words'. larger groups means a better chance of meaningful predictions, but at the same time
//also means a chance of no matches whatsoever.
var ctx = canvas.getContext('2d');
currImg.setAttribute('crossOrigin','anonymous');
var getPics = function(num) {
    markObjs = {};
    imgArr = [];
    imNum = 0;
    currMarkNum = 0;
    fullMarks = '';
    goodBad = [0, 0];
    console.log('trying google!')
    var query = $('#query').val()
    num = parseInt(num);
    if (num == 1) {
        imNum = 0;
        $('#picResBox').html('');
        imgUrls = [];
    }
    var theUrl = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyAKJJLiYq5NUL5GIgNSv_akeceClwi7MPk&cx=13117340402592336685:p37mtp7h38a&searchType=image&start=' + num + '&imgSize=' + sz + '&q=' + query;
    // theUrl='invalid'
    $.get(theUrl).success(function(res) {
        for (var i = 0; i < res.items.length; i++) {
            if ((res.items[i].image.height / res.items[i].image.width) > .9 && (res.items[i].image.height / res.items[i].image.width) < 1.1) {
                //we only one images that are vaguely square.
                imgUrls.push(res.items[i].link);
            }
        }
        if (!num || num < 20) {
            num += 10;
            getPics(num)
        } else {
            console.log('done loading imgs from google. Running image analysis. List of imgUrls', imgUrls);
            currImg.src = imgUrls[imNum];
            console.log('attempt pic:', imgUrls[imNum], currImg)
        }
    }).error(function(err) {
        //if google says "enuff!", use lorem pixel as alternative
        console.log('google failed, using lorempixel!')
        for (var i = 0; i < 10; i++) {
            imgUrls.push('http://lorempixel.com/80/80/people/')
        }
        currImg.src = imgUrls[imNum];
    })
}
currImg.onload = function(e) {
    // execute drawImage statements here
    console.log('img loaded',currImg.src)
    ctx.drawImage(currImg, 0, 0, canvas.width, canvas.height);
    var isFF = navigator.userAgent.indexOf('Firefox') !== -1;
    if (isFF) {
        getPx(currImg);
    } else {
        //this demo wont work in anything but FF, due to restraints on dirty canvases (hawt).
        alert('Please use Firefox for this demo!');
    }
};
var getPx = function(currImg) {
    var h = currImg.height,
        w = currImg.width,
        x = 0,
        y = 0;
    //put it on the localStorage to avoid cors stuff
    var imgData = ctx.getImageData(x, y, w, h).data;
    imgArr = []; //clear the array
    for (var i = 0; i < imgData.length - 4; i += 4) {
        imgArr.push({
            r: imgData[i],
            g: imgData[i + 1],
            b: imgData[i + 2],
        })
    }
    var toMark = []; //array we'll send to markov chain generators
    for (i = 0; i < imgArr.length - (pxGrpSize - 1); i += pxGrpSize) {
        var strToAdd = '';
        for (var j = 0; j < pxGrpSize; j++) {
            strToAdd += '_' + imgArr[j + i].r + '@' + imgArr[j + i].g + '@' + imgArr[j + i].b;
        }
        toMark.push(strToAdd);
    }
    generateMarkov(toMark);
}
var generateMarkov = function(arr) {
    //for each element in the chain, find the +1 element
    for (var i = 0; i < arr.length; i++) {
        if (!markObjs[arr[i]]) {
            //if this is the first time we've seen this 'word', add it to our object.
            markObjs[arr[i]] = {};
        }
        //now we look at the following 'word' to see wot it says
        if (!markObjs[arr[i]][arr[i + 1]]) {
            //have not seen this follower before.
            markObjs[arr[i]][arr[i + 1]] = 1;
        } else {
            markObjs[arr[i]][arr[i + 1]]++;
        }
    }
    console.log('markObjs after this image (' + imgUrls[imNum] + ')', markObjs)
    imNum++;
    if (imgUrls[imNum]) {
        currImg.src = imgUrls[imNum];
    } else {
        //no more pics to analyze, so we can go ahead and make the markov-generated string.
        var seed = Object.keys(markObjs)[Math.floor(Math.random() * Object.keys(markObjs).length)]; //pick a random start seed
        console.log('done generating markov objs!')
        doMark(seed);
    }
}

var doMark = function(seed) {
    //this function takes the markov 'chain' object (created in generateMarkov) and generates output based on that markov chain
    for (currMark = 0; currMark < markLen; currMark++) {
        fullMarks += seed;
        var theWord = markObjs[seed];
        console.log(theWord, seed, markObjs)
        var theWordKeys = Object.keys(theWord),
            finalFollow = [];
        for (var i = 0; i < theWordKeys.length; i++) {
            for (var j = 0; j < theWord[theWordKeys[i]]; j++) {
                //basically, we push the follower into the finalFollow array repeatedly,
                //by its frequency. More frequent followers are pushed in more
                //this increases their chance of being chosen at random!
                finalFollow.push(theWordKeys[i])
            }
        }
        seed = finalFollow[Math.floor(Math.random() * finalFollow.length)];
        if (!markObjs[seed]) {
            seed = Object.keys(markObjs)[Math.floor(Math.random() * Object.keys(markObjs).length)];
            goodBad[1]++;
        } else {
            //seed DOES exist
            goodBad[0]++;
        }
    }
    if ((goodBad[1] / goodBad[0]) > (1 / 3)) {
        alert('Warning: Unusually high random color seeking! Try increasing the markov unit size!')
    }
    console.log('markov generated:', fullMarks)
    paintImage();
}

var paintImage = function() {
    //this function actually draws the pixels;
    var w = canvas.width,
        h = canvas.height,
        x = 0,
        y = 0,
        pix = fullMarks.split('_');
    pix.shift();
    //first, split the chain. Chop off initial element since it's blank
    console.log('pix', pix)
        //now, for each pixel, take its rgb value (by splitting at "@"), and draw a pixel of this val
    for (var i = 0; i < pix.length; i++) {
        var currRGB = pix[i].split('@');
        ctx.fillStyle = "rgb(" + currRGB[0] + "," + currRGB[1] + "," + currRGB[2] + ")";
        ctx.fillRect(x, y, 1, 1);
        x++;
        if (x >= w) {
            y++;
            x = 0;
        }
    }
};
var trigMod = function(m) {
    m = parseInt(m) || 0;
    if (!m) {
        $('#explModal .modal-title').html('Group Size');
        $('#explModal .modal-body').html('The group size refers to how large each Markov chain \'group\' is. Larger groups increase the chance of meaningful predictions, but may decrease the odds of <i>any</i> predictions. If your sample is extremely low, you may want to stick with smaller group sizes.');
    } else {
        $('#explModal .modal-title').html('Markov Chain Size');
        $('#explModal .modal-body').html('The Markov chain size refers to how many pixels the app will attempt to \'draw\'. Larger sizes take vastly more time to draw, so be careful! Start small and THEN work your way up.');
    }
    $('#explModal').modal()
}

$('#grpSize').change(function() {
    pxGrpSize = parseInt($('#grpSize').val);
})
$('#chainSize').change(function() {
    markLen = parseInt($('#chainSize').val);
})