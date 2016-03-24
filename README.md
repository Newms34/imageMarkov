#Image Markov
----
##What It Is
This is an experiment with [Markov chains](https://en.wikipedia.org/wiki/Markov_chain) and images. I'm currently working out what the best source of random images is. Google Image search works, but the data limits are proving troublesome.
***
##How It Works
 1. I load images from an external source. Right now I'm using Lorempixel and a very low number of images. However, that may change in the future! I can also use Google Images.
 2. I paint each picture onto a `<canvas>` element.
 3. Once the image is loaded (addEventListener, folks!), I use `context.getImageData` to... surprise surprise... get the image data. That is, an array where every three elements is an RGB set. So the first pixel is `rgb(arr[0],arr[1],arr[2])`, the second pixel is `rgb(arr[3],arr[4],arr[5])`, and so on.
 4. I then convert this giant array (srsly, it's giant) into a slightly-less-giant array, where each element of that array is a single object with three properties, and represents the RGB value of a single pixel.
 5. More loops! I loop thru the RGB-object-array, and do some Markov Magic. 
 6. First, I make another object. Each property of the object will be one UNIQUE pixel color. For each unique pixel color, I put a bunch of properties on that unique-color-object.
 7. Each of these properties represents one unique 'follower' of whatever pixel we're talking about, and the value of the property is the number of times that follower happens. So, for example, if (255,255,0) is followed by (128,232,50) in one place, and (23,56,212) in another, and then (128,2332,50) again in a third place, our object would look like this:
 ```
255@255@0: {
128@232@50:2,
23@56@212:1
}
```

  If you're wondering what the `@`s are doing there, that's so I can convert the whole thing to a string later (makes generating  Markovs easier!).
 8. Next, it's Markov time!I pick a random seed element to start the chain.
 9. I look at that element in our giant markov object (we made this in '7' above). For each 'follower' in that array, I look at the number of occurences of that follower (the value, remember?). 
 10. I generate a temporary array which is simply each follower, repeated by its frequency number. So for our example above, the array would be: `['128@232@50','128@232@50','23@56@212']`
 11. This basically makes it so that I can pick a 'next' pixel for each pixel I have, where the odds of picking any particular 'next' pixel are equivalent to the odds of that combination actually occuring in one of my images.
 12. I keep doing this, picking the most likely next pixel, analyzing that pixel's followers, picking the most likely next pixel, etc.
 13. Finally, we paint everything to the canvas.

##How It Doesn't Work
 Q. It says I need to use Firefox!
 
 A. So... why aren't you using Firefox? Seriously, Firefox is [not bad](http://www.pcworld.com/article/2605933/browser-comparison-how-the-five-leaders-stack-up-in-speed-ease-of-use-and-more.html). If you're wondering, a security 'feature' in Chrome and Safari prevents getting data from 'dirty' canvases - that is, canvases that have had stuff put on them from outside sources. So Firefox is our only real option here.
 
 
 Q. I think it crashed!
 
 A. Notice how small the images are? That's because if they were any bigger, the script WOULD really crash. As it has, the initial imageData array is at LEAST 19,200 elements long. Each 'analysis' step takes multiple calculations and loops, so it's slow! Be patient! Eventually I'll slap a progress bar in there somewhere.
 
 
 Q. It doesn't really look like anything!
 
 A. This isn't supposed to be the next Monet. It's an examination of the theory. Translation: I suck @ art.


 Q. Can't I just run it off of github?

 A. You could, but... then I'd have to delete it from github. Please don't. Running it off of github is gonna make them hate me (for the data rates involved). Don't make github hate me.
