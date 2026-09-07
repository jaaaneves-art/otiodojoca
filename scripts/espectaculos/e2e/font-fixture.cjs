// Next's own font test hook; use a system font without any Google request.
module.exports = new Proxy({}, { get: () => "@font-face { font-family: 'Inter'; src: local('Arial'); font-style: normal; font-weight: 100 900; }" });
