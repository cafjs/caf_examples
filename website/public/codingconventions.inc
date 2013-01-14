<h1 id="cafcodingconventions">CAF Coding Conventions</h1>

<h2 id="functionalobjects">Functional objects</h2>

<p>Don&#8217;t use <code>new</code> or <code>this</code>. Create objects using closures. A great description of this functional style is in Crockford&#8217;s book <a class="citation" href="#fn:1" title="Jump to citation">[1]<span class="citekey" style="display:none">Crockford:2008</span></a>. We do that for two reasons: first, we can use methods as callbacks without much binding fuss; second, we have much better encapsulation, and private object state simplifies secure multi-tenancy.</p>

<h2 id="donotrelyonexceptions">Do not rely on exceptions</h2>

<p>Do not <code>throw</code>. Exceptions and asynchronous code do not mix well. Use standard node.js callback conventions to propagate errors (i.e., first argument not a falsy).</p>

<h2 id="sticktonode.jscallbackconventionsandusetheasynclibrary">Stick to node.js callback conventions and use the &#8216;async&#8217; library</h2>

<p>There are many ways to manage asynchronous code. It is not that important which one you choose but it is critical that you don&#8217;t mix. Most node.js libraries use a simple callback convention. The &#8216;async&#8217; library just builds on this convention to provide higher-order abstractions. CAF implements actors using &#8216;async&#8217; but it also maintains this callback convention. </p>

<h2 id="namecallbacksusingnestinglevels">Name callbacks using nesting levels</h2>

<p>We use the following naming scheme for callbacks: cb, cb0, cb1, cb2,&#8230; where the number gives you the nesting level. The goal is to avoid calling the wrong callback by making the code a bit easier to read. For example:</p>

<pre><code>var f = function(x, cb) {
   async.series([
                 function(cb0)  {
                     ...
                     cb0(null, &quot;something&quot;);
                 },
                 function(cb0) {
                      var cb1 = function(err, data) {
                        cb0(err, data);
                      }
                      ...
                      cb1(null,&quot;whatever&quot;) 

                 }], function(err, data) {
                     cb(err, data)
                 }
                );   
}
</code></pre>

<h2 id="donotusereturninasynchronouscode">Do not use <code>return</code> in asynchronous code</h2>

<p>By convention, when the last argument of a function call is a callback, you must use this callback if you need to return a value. To enforce this convention we do not use <code>return</code> inside the function. This means that all the execution paths of your function should terminate by calling the callback. For example, instead of writing:</p>

<pre><code>var f = function(x, cb) {
    if (x &gt; 2) {
        return cb(null, 2); 
    }
    if (x &lt; 1) {
        return cb(null, 1);
    }
    cb(null, 0);
}
</code></pre>

<p>we use the following style:</p>

<pre><code>var f = function(x, cb) {
    if (x &gt; 2) {
       cb(null, 2);
    } else if (x &lt; 1) {
       cb(null, 1);
    } else {
       cb(null, 0);
    }    
}
</code></pre>

<h2 id="callbackinvocationsarealwaystailcalls">Callback invocations are always tail calls</h2>

<p>When a callback is not used as a tail call it creates very complex control flow. For example:</p>

<pre><code>var countCalls = 0;
var f = function(x, cb) {
    async.series([
                  function (cb0) {    
                      cb0(null);
                      countCalls = countCalls + 1;
                  },
                  function (cb0) {   
                       console.log(&quot;#calls&quot; + countCalls);
                       cb0(null);
                  }], function(err, data) {
                  ...
</code></pre>

<p>will not increment <code>countCalls</code> when you would expect&#8230;</p>

<h2 id="syntax">Syntax</h2>

<p>We are a bit old fashioned. Always use semicolons, commas at the end, no tabs,
four spaces to indent, 80 characters per line, and always use curly braces (opening braces in the same line).</p>

<h2 id="documentation">Documentation</h2>

<p>If you are writing a plugin it is critical that <code>README.md</code> describes the snippets of JSON that need to be inserted in <code>framework.json</code> and <code>ca.json</code>; i.e., include the expected names of your modules, and the properties that can be configured. </p>

<p>It is also important that the proxy class file has proper JSDoc since it defines the interface visible to application code. Use Google&#8217;s standard type descriptions as shown in <a href="http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml#JavaScript_Types">JavaScript Style Guide</a></p>

<p>The plan is to automatically extract and aggregate that information for all plugins, but we don&#8217;t have a tool just yet.</p>

<h2 id="semanticversioningandnpmshrinkwrap">Semantic versioning and npm shrinkwrap</h2>

<p>We will follow <a href="http://semver.org/">SemVer 2.0</a> policies for version numbers. Our current major version is 0, and this means that you are out of luck, anything may change at any time. </p>

<p>We always shrinkwrap applications (with npm), and it is crucial that your plugins increment version numbers whenever they change; otherwise, it would be impossible to recreate in a consistent manner an application that uses any of your plugins. Moreover, if you publish an app that uses your own plugins, make sure that the exact versions of those plugins listed in <code>npm-shrinkwrap.json</code> are publicly available (e.g., in a public npm directory or github). </p>

<h2 id="usethecaf_prefixtonameyourpluginpackages">Use the <code>caf_</code> prefix to name your plugin packages</h2>

<p>A CAF plugin has little use outside CAF, but we use generic npm packages and directories to facilitate its development. The main npm directory has a flat name space, and it is very important that we do not pollute it with our special-purpose packages. For this reason, always prefix your plug-in package names with &#8216;caf_&#8217;. The bonus feature is that we will be able to easily list all the CAF plugins from the npm directory, and extract CAF documentation from them. Our &#8216;Website&#8217; app could have a CA that periodically checks for changes in the directory, and rebuilds the documentation when needed. </p>

<div class="footnotes">
<hr />
<ol>

<li id="fn:1" class="citation"><span class="citekey" style="display:none">Crockford:2008</span><p>Douglas Crockford. <em>JavaScript: The Good Parts</em>. O&#8217;Reilly 2008.</p>
</li>

</ol>
</div>

