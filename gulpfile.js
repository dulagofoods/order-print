const gulp = require('gulp');
const browserSync = require('browser-sync');

// Static ssl
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: "./public/",
      ghostMode: {
        clicks: true,
        forms: true,
        scroll: false
      }
    },
    ghostMode: {
      clicks: false,
      forms: false,
      scroll: false
    }
  });
  gulp.watch("public/*.html").on('change', browserSync.reload);
});

gulp.task('default', ['browser-sync']);