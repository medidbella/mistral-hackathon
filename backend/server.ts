import fastify from "fastify";

const server = fastify();

server.listen({ port: 3000 }, (err, addr) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${addr}`);
});

