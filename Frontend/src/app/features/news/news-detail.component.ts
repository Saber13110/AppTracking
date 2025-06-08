import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NewsService } from './services/news.service';
import { NewsArticle } from './models/news';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news-detail.component.html',
  styleUrls: ['./news-detail.component.scss']
})
export class NewsDetailComponent implements OnInit, OnDestroy {
  slug: string | null = null;
  article: NewsArticle | null = null;
  private paramsSub: Subscription | null = null;
  private articleSub: Subscription | null = null;

  constructor(private route: ActivatedRoute, private newsService: NewsService) {}

  ngOnInit() {
    this.paramsSub = this.route.params.subscribe(params => {
      this.slug = params['slug'];
      if (this.slug) {
        this.articleSub?.unsubscribe();
        this.articleSub = this.newsService
          .getArticle(this.slug)
          .subscribe(article => (this.article = article));
      }
    });
  }

  ngOnDestroy() {
    this.paramsSub?.unsubscribe();
    this.articleSub?.unsubscribe();
  }
}
