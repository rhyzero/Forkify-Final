import "core-js/stable";
import {async} from 'regenerator-runtime'
import { api_URL,resPerPage,APIKEY } from './config'
import { getJSON,sendJSON } from './helpers'
import recipeView from './views/recipeView'
import addRecipeView from "./views/addRecipeView";

export const state = {
    recipe: {},
    search: {
        query: '',
        results: [],
        page: 1,
        resultsPerPage: resPerPage
    },
    bookmarks: [],
}

const createRecipeObject = function(data) {
    const {recipe} = data.data

    return {
      id: recipe.id,
      title: recipe.title,
      publisher: recipe.publisher,
      sourceUrl: recipe.source_url,
      image: recipe.image_url,
      servings: recipe.servings,
      cookingTime: recipe.cooking_time,
      ingredients: recipe.ingredients,
      ...(recipe.key && { key : recipe.key})
    }
}

export const loadRecipe = async function(id) {
    try{
        const data = await getJSON(`${api_URL}/${id}?key=${APIKEY}`)
        state.recipe = createRecipeObject(data)
        if (state.bookmarks.some(b => b.id === id)) state.recipe.bookmarked = true;
        else state.recipe.bookmarked = false
    }
    catch(err) {
        console.error(`${err} 🗿`)
        throw err;
    }
}

export const loadSearchResults = async function(search) {
    try{
        state.search.query = search
        const data = await getJSON(`${api_URL}?search=${search}&key=${APIKEY}`)
        state.search.results = data.data.recipes.map(rec => {
            return {
                id: rec.id,
                title: rec.title,
                publisher: rec.publisher,
                image: rec.image_url,
                ...(rec.key && { key : rec.key})
            }
        })
        state.search.page = 1
    }catch(err) {
        throw err;
    }
}

export const getSearchResultPage = function(page = state.search.page) {
    state.search.page = page
    const start = (page - 1) * state.search.resultsPerPage
    const end = page * state.search.resultsPerPage
    return state.search.results.slice(start, end)
}

export const updateServings = function(newServings) {
    state.recipe.ingredients.forEach(ing => {
        ing.quantity = ing.quantity * newServings / state.recipe.servings
    })

    state.recipe.servings = newServings
}

const persistBookmarks = function() {
    localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks))
}

export const addBookmark = function(recipe) {
    state.bookmarks.push(recipe)

    if(recipe.id === state.recipe.id) state.recipe.bookmarked = true
    persistBookmarks()
}

export const deleteBookmark = function(id) {
    const index = state.bookmarks.findIndex(el => el.id === id)
    state.bookmarks.splice(index, 1) 
    if(id === state.recipe.id) state.recipe.bookmarked = false
    persistBookmarks(); 
}

const init = function() {
    const storage = localStorage.getItem('bookmarks')
    if(storage) state.bookmarks = JSON.parse(storage)
}

init();
const clearBookmarks = function() {
    localStorage.clear('bookmarks')
}

// clearBookmarks();

export const uploadRecipe = async function(newRecipe) {
    try{
    const ingredients = Object.entries(newRecipe)
    .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
    .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim())
        // const ingArr = ing[1].replaceAll(' ', '').split(',')
        if (ingArr.length !== 3) throw new Error('Wrong ingredient format!')
        const [quantity, unit, description] = ingArr
        return {quantity : quantity ? +quantity : null, unit, description}
    })

    const recipe = {
        title: newRecipe.title,
        source_url: newRecipe.sourceUrl,
        image_url: newRecipe.image,
        publisher: newRecipe.publisher,
        cooking_time: +newRecipe.cookingTime,
        servings: +newRecipe.servings,
        ingredients,
    }

    const data = await sendJSON(`${api_URL}?key=${APIKEY}`, recipe)
    state.recipe = createRecipeObject(data)
    addBookmark(state.recipe)
    }catch(err) {
        throw err;
    }
    
}