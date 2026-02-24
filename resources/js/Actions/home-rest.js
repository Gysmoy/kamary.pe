import BasicRest from "./BasicRest";

class HomeRest extends BasicRest {
    search = (query) => this.simplePost('/api/search?query=' + encodeURIComponent(query))
}

export default HomeRest