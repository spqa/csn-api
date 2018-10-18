const {ApolloServer, gql} = require('apollo-server-lambda');
const http = require('http');
const xpath = require('xpath');
const xmldom = require('xmldom').DOMParser;

const BASE = 'http://chiasenhac.vn';
const typeDefs = gql`
    enum ChartType {
        en
        vi
        cn
        ko
        ja
    }

    enum QualityType {
        k32
        k128
        k320
        M4A
    }

    #    interface ISong {
    #        avatar: String
    #        name: String
    #        artist: String
    #    }

    type Song {
        source: String!
        album: String
        lyric: String
        listen: Int
        avatar: String
        name: String
        artist: String
        quality: [QualityType]
    }

    type SongChartItem {
        rank: Int
        url: String
        avatar: String
        name: String
        artist: String
    }

    type Query {
        chart(type: ChartType = en): [SongChartItem]

        song(url: String!, quality: String = "k128"): Song

        hello: String
    }
`;

const resolvers = {
    Query: {
        chart: chartResolver,
        hello: helloWorldResolver,
        song: songResolver
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers
});

function helloWorldResolver() {
    console.log("hello");
    return new Promise((resolve, reject) => {
        resolve("Hello!");
    });
}

async function chartResolver(root, args, contact, info) {
    console.log("chart resolver", info);
    console.log("args:", JSON.stringify(args, null, 2));
    switch (args.type) {
        case 'en':
            const URL = `${BASE}/mp3/us-uk/`;
            return await getChart(URL);
        case 'vi':
        case 'cn':
        case 'ko':
        case 'ja':
        default:
            return [];
    }
}

function songResolver(root, args, contact, info) {
    console.log("song resolver", info);
    console.log("args:", JSON.stringify(args, null, 2));
}

async function getChart(url) {
    try {
        const content = await getContent(url);
        const doc = new xmldom().parseFromString(
            content.replace("\n", "").replace("<BODY", "<body")
                .replace("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">", "")
                .replace('xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="vi" xml:lang="vi"', ""));
        // xpath.useNamespaces({"html": "http://www.w3.org/1999/xhtml"});
        const nodes = xpath.select("(//div[contains(@class, 'h-center')])[1]/div[contains(@class, 'list-r')]", doc);
        return nodes.map(x => {
            return {
                rank: parseInt(xpath.select('string(.//span[contains(@class,"topranks")])', x)),
                url: xpath.select1('.//a/@href', x).value,
                avatar: xpath.select1('.//img/@src', x).value,
                name: xpath.select('string(.//a)', x),
                artist: xpath.select('string(.//p[@class])', x),
            }
        });
    } catch (e) {
        console.log("error", e);
        return [];
    }
}

function getContent(url) {
    console.log("URL: " + url);
    return new Promise((resolve, reject) => {
        const request = http.get(url, function (res) {
            let content = '';
            console.log("Got response: " + res.statusCode);
            res.on('data', function (chunk) {
                content += chunk;
            });
            res.on('end', () => resolve(content));
        }).on('error', function (e) {
            console.error("Got error: " + e.message);
            reject(e);
        });
        request.end();
    });
}

exports.handle = server.createHandler();
