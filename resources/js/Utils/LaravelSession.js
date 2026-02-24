const LaravelSession = {}
LaravelSession.set = (name, value) => { LaravelSession[name] = value }
LaravelSession.get = (name) => LaravelSession[name] ?? null

export default LaravelSession