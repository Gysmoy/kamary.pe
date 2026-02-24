import BasicRest from "../BasicRest";

class CardsRest extends BasicRest {
    path = 'seller/cards'
    hasFiles = true

    get = async (language, id) => this.simpleGet(`/api/${this.path}/${language}/${id}`)
    search = async (language, name, number) => this.simpleGet(`/api/${this.path}/search?language=${language}&name=${encodeURIComponent(name)}&number=${encodeURIComponent(number)}`)
}

export default CardsRest