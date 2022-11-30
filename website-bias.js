import { biasRatings } from './bias-ratings.js';


const biasLabel = document.getElementById('bias-label');
const biasImage = document.getElementById('bias-image');

const imageMap = {
   left: './rating-images/left.png',
   'left-center': './rating-images/left-center.png',
   center: './rating-images/center.png',
   'right-center': './rating-images/right-center.png',
   right: './rating-images/right.png',
};

const removeProtocolFromUrl = (url) => {
   let strippedUrl = url.replace('https://', '');
   strippedUrl = strippedUrl.replace('http://', '');
   strippedUrl = strippedUrl.replace('www.', '');
   return strippedUrl;
};

const getBaseUrl = (url) => {
   let strippedUrl = removeProtocolFromUrl(url);
   return strippedUrl.split('/')[0];
};

const areUrlsSimilar = (urlA, urlB) => {
   return getBaseUrl(urlA) === getBaseUrl(urlB);
};

const getUrlPath = (url) => {
   return removeProtocolFromUrl(url).split('/').slice(1);
};

const findMostFitUrl = (url, matches) => {
   /* There are some URLs that have the same base but different paths
   * e.g. cnn.com vs. cnn.com/opinion
   * However, when viewing an article, sometimes the base URL doesn't match up fully with AllSides
   * (the article url might be something like cnn.com/2012/opinion)
   * To account for this, we take the url (the current tab url) path, and compare it agains all
   * of the paths in each match, and find the one that has the most similarities
   */

   if (matches.length === 1) return matches[0];

   const urlPath = getUrlPath(url);
   let index = 0;
   let highScore = 0;
   let basicMatch = null;
   matches.forEach((match, i) => {
      let score = 0;
      const path = getUrlPath(match);
      
      if (path.length === 0) {
         basicMatch = match;
      }

      path.forEach((a) => {
         urlPath.forEach(b => {
            if (a == b) {
               score += 1;
            }
         });
      });

      if (score > highScore) {
         index = i;
         highScore = score;
      }
   });
   if (highScore === 0 && basicMatch) {
      return basicMatch
   }
   return matches[index];
};

// fetches the active tab, takes the url and looks for a matching url from AllSides ratings then
// displays that rating and the matched URL
chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
   let currentUrl = tabs[0].url

   const matches = Object.keys(biasRatings).filter((publication_url) => {
      return areUrlsSimilar(currentUrl, publication_url);
   });

   if (matches.length === 0) {
      biasLabel.textContent = 'No Bias Rating For This Site';
      return;
   }
   const url = findMostFitUrl(currentUrl, matches);

   if (!imageMap[biasRatings[url]]) {
      return;
   }

   biasImage.src = imageMap[biasRatings[url]];
   biasLabel.textContent = url;
});