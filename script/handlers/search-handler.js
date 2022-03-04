
import 'dotenv/config' 
export async function getGIF(search_term){
    return new Promise(async (resolve, err)=>{
        var url = `http://api.giphy.com/v1/gifs/search?q=${search_term}&api_key=${process.env.GIPHY_KEY}&limit=5`
        fetch(url)
            .then( response =>response.json())
            .then(content => {
                var imgURL = content.data[0].images.downsized.url;
                resolve(imgURL)
        })
    })
}
/*
export function getRecipe(  _keywords , _type ){
    // _type : [ "findByIngredients" , "mealplanner" , "findByNutrients","random" ]
    var APIKEY = process.env.FOOD_API; 

    return new Promise(async (resolve, err)=>{
        var url = `https://api.spoonacular.com/`
        if( _type == 'findByIngredients'){url += `recipes/findByIngredients?apiKey=${APIKEY}&number=2&ingredients=`+_keywords; }
        else if (_type == 'mealplanner'){url += `mealplanner/generate?apiKey=${APIKEY}&timeFrame=day`}
        else if(_type == 'findByNutrients'){url +=`recipes/findByNutrients?apiKey=${APIKEY}&maxCarbs=50&number=2`}
        else{url += `recipes/random?apiKey=${APIKEY}&tags=dinner&number=2`}
        fetch(url)
            .then( response => response.json())
            .then(content => {
                console.log( content )
                resolve(content)
        })
    })
}
*/ 


/*
export function getRecipe(_keywords){
    const Http = new XMLHttpRequest();
    const url = `https://tasty.co/topic/dinner`
    Http.open("GET",url)

}
getRecipe('chicken soup');
*/