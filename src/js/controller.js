import * as model from './model.js'
import recipeView from './views/recipeView.js'
import searchView from './views/searchView.js'
import resultsView from './views/resultsView.js'
import bookmarksView from './views/bookmarksView.js'
import paginationView from './views/paginationView.js'
import addRecipeView from './views/addRecipeView.js'
import { windowCloseTime } from './config.js'

import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { async } from 'regenerator-runtime'

// if (module.hot) {
//   module.hot.accept();
// }

const recipeContainer = document.querySelector('.recipe');

// https://forkify-api.herokuapp.com/v2

///////////////////////////////////////
const showRecipe = async function() {
  try {
    const id = window.location.hash.slice(1)
    if (!id) return
    recipeView.renderSpinner(recipeContainer);
    resultsView.update(model.getSearchResultPage())
    bookmarksView.update(model.state.bookmarks)
    //1. Getting recipe from API
    await model.loadRecipe(id);
    //2. Rendering recipe
    recipeView.render(model.state.recipe)
  }
  catch(err){
    recipeView.renderError()
  }
};

const controlSearchResults = async function() {
  try{
    resultsView.renderSpinner();
    const query = searchView.getQuery();
    if (!query) return
    
    await model.loadSearchResults(query)

    //resultsView.render(model.state.search.results)
    resultsView.render(model.getSearchResultPage())
    paginationView.render(model.state.search)
  }catch(err){
    throw err;
    console.error(err)
  }
}


const controlServings = function(newServings) {
  model.updateServings(newServings)
  recipeView.render(model.state.recipe)
}

const controlPagination = function(goToPage) {
    resultsView.update(model.getSearchResultPage(goToPage))
    paginationView.render(model.state.search)
}

const controlAddBookmark = function() {
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe)
  else model.deleteBookmark(model.state.recipe.id)
  recipeView.update(model.state.recipe)
  bookmarksView.render(model.state.bookmarks)
}

const controlBookmarks = function() {
  bookmarksView.render(model.state.bookmarks)
}

const controlRecipe = async function(newRecipe) {
  try{
    addRecipeView.renderSpinner()
    await model.uploadRecipe(newRecipe)
    recipeView.render(model.state.recipe)
    addRecipeView.renderMessage()
    bookmarksView.render(model.state.bookmarks)
    window.history.pushState(null, '', `#${model.state.recipe}`)
    setTimeout(function() {
      addRecipeView.toggleWindow()
    }, windowCloseTime * 1000)
  } catch(err) {
    console.error(err)
    addRecipeView.renderError(err.message)
  }
}

const testFunction = function() {
  console.log('Test');
}

const init = function() {
  bookmarksView.addHandlerRender(controlBookmarks)
  recipeView.addHandlerRender(showRecipe)
  recipeView.addHandlerUpdateServings(controlServings)
  recipeView.addHandlerAddBookmark(controlAddBookmark)
  searchView.addHandlerSearch(controlSearchResults)
  paginationView.addHandlerClick(controlPagination)
  addRecipeView._addHandlerUpload(controlRecipe)
  testFunction()
}
init();